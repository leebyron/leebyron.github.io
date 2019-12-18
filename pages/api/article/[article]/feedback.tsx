import { Client as FaunaClient, query as q } from 'faunadb'
import { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import {
  getBySlug,
  FrontMatter
} from '../../../../components/article/frontMatter'
import {
  MAX_FEEDBACK_COUNT,
  FeedbackResponse,
  NativeFeedback,
  MediumPostFeedback
} from '../../../../components/article/Feedback'

const ALLOWED_HEADERS = [
  'X-Requested-With',
  'Access-Control-Allow-Origin',
  'X-HTTP-Method-Override',
  'Content-Type',
  'Authorization',
  'Accept'
]

export default async (
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse>
) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (req.method === 'GET' || req.method === 'OPTIONS') {
      res.setHeader(
        'Cache-Control',
        'maxage=10, s-maxage=300, stale-while-revalidate=15768000'
      )
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST')
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(','))
      res.setHeader('Access-Control-Max-Age', '3600')
      res.statusCode = 204
      res.end()
      return
    }

    const { article } = req.query
    const frontMatter =
      typeof article === 'string' ? getBySlug(article) : undefined

    if (typeof article !== 'string' || !frontMatter) {
      res.statusCode = 404
      res.json({ message: 'Unknown article', article } as any)
      return
    }

    if (req.method === 'GET') {
      const [nativeFeedback, mediumFeedback] = await Promise.all<
        NativeFeedback,
        MediumPostFeedback | undefined
      >([getNativeFeedback(article), getMediumPostFeedback(frontMatter)])

      res.json({ nativeFeedback, mediumFeedback })
    } else if (req.method === 'POST') {
      const { nonce, count, client } = req.body
      if (typeof count !== 'number' || count > MAX_FEEDBACK_COUNT) {
        throw new Error('Bad feedback count')
      }
      if (typeof client !== 'string') {
        throw new Error('Missing client')
      }
      const nativeFeedback = await updateNativeFeedback(article, client, count)
      res.json({ nonce, nativeFeedback })
    } else {
      res.statusCode = 500
      res.json(`Unsupported method ${req.method}` as any)
    }
  } catch (error) {
    res.statusCode = 500
    res.json((error && error.message) || error)
  }
}

function getNativeFeedbackQuery(article: string) {
  return q.Let(
    {
      allFeedback: q.Paginate(q.Match(q.Index('feedback_by_article'), article))
    },
    {
      now: q.Now(),
      totalClients: q.Select(['data', 0], q.Count(q.Var('allFeedback'))),
      totalFeedbackCount: q.Select(
        ['data', 0],
        q.Sum(
          q.Map(q.Var('allFeedback'), x =>
            q.Select(['data', 'count'], q.Get(x))
          )
        )
      )
    }
  )
}

async function getNativeFeedback(article: string): Promise<NativeFeedback> {
  const secret = process.env.FAUNA_SECRET
  if (!secret) {
    throw new Error('Missing Fauna Secret')
  }
  return await new FaunaClient({ secret }).query(
    getNativeFeedbackQuery(article)
  )
}

async function getMediumPostFeedback(
  frontMatter: FrontMatter
): Promise<MediumPostFeedback | undefined> {
  if (frontMatter.medium) {
    const response = await fetch(frontMatter.medium)
    if (response.status === 200) {
      const source = await response.text()
      const clapMatch = /"clapCount":(\d+)/.exec(source)
      const voterMatch = /"voterCount":(\d+)/.exec(source)
      if (clapMatch && voterMatch) {
        return {
          clapCount: parseInt(clapMatch[1], 10),
          voterCount: parseInt(voterMatch[1], 10)
        }
      }
    }
  }
  return { clapCount: 0, voterCount: 0 }
}

async function updateNativeFeedback(
  article: string,
  client: string,
  count: number
): Promise<NativeFeedback> {
  const secret = process.env.FAUNA_SECRET
  if (!secret) {
    throw new Error('Missing Fauna Secret')
  }
  return await new FaunaClient({ secret }).query(
    q.Do(
      q.Let(
        {
          clientFeedback: q.Match(q.Index('feedback_by_article_and_client'), [
            article,
            client
          ])
        },
        q.If(
          q.Exists(q.Var('clientFeedback')),
          count === 0
            ? q.Delete(q.Select('ref', q.Get(q.Var('clientFeedback'))))
            : q.Update(q.Select('ref', q.Get(q.Var('clientFeedback'))), {
                data: { count }
              }),
          count === 0
            ? (null as any)
            : q.Create(q.Collection('feedback'), {
                data: { article, client, count }
              })
        )
      ),
      getNativeFeedbackQuery(article)
    )
  )
}
