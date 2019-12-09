import { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import { getBySlug, FrontMatter } from '../../components/article/frontMatter'
import { Client as FaunaClient, query as q } from 'faunadb'
import {
  MAX_FEEDBACK_COUNT,
  FeedbackResponse,
  NativeFeedback,
  MediumPostFeedback
} from '../../components/article/Feedback'

const ALLOWED_HEADERS = [
  'X-Requested-With',
  'Access-Control-Allow-Origin',
  'X-HTTP-Method-Override',
  'Content-Type',
  'Authorization',
  'Accept'
]

const ALLOWED_ORIGINS = {
  'localhost:3000': true,
  'lwb.io': true,
  'leebyron.com': true,
  'leebyron.netlify.com': true,
  'leebyron.now.sh': true
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<FeedbackResponse>
) => {
  try {
    console.log(req.headers.origin)
    if (
      typeof req.headers.origin === 'string' &&
      req.headers.origin in ALLOWED_ORIGINS
    ) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST')
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(','))
      res.setHeader('Access-Control-Max-Age', '3600')
      res.statusCode = 204
      res.end()
      return
    }

    const { article, client } = req.query
    const frontMatter =
      typeof article === 'string' ? getBySlug(article) : undefined

    if (typeof article !== 'string' || !frontMatter || Array.isArray(client)) {
      res.statusCode = 404
      res.end()
      return
    }

    if (req.method === 'POST') {
      const { count } = req.body
      if (typeof count !== 'number' || count > MAX_FEEDBACK_COUNT) {
        throw new Error('Bad feedback count')
      }
      await updateNativeFeedback(article, client, count)
    }

    const [nativeFeedback, mediumFeedback] = await Promise.all<
      NativeFeedback,
      MediumPostFeedback | undefined
    >([getNativeFeedback(article, client), getMediumPostFeedback(frontMatter)])

    res.statusCode = 200
    if (req.method === 'GET') {
      res.setHeader(
        'Cache-Control',
        'max-age=0, s-maxage=300, stale-while-revalidate'
      )
    }
    res.json({ nativeFeedback, mediumFeedback })
  } catch (error) {
    res.statusCode = 500
    res.end(JSON.stringify((error && error.message) || error))
  }
}

async function getNativeFeedback(
  article: string,
  client: string
): Promise<NativeFeedback> {
  const secret = process.env.FAUNA_SECRET
  if (!secret) {
    throw new Error('Missing Fauna Secret')
  }
  return await new FaunaClient({ secret }).query(
    q.Let(
      {
        clientFeedback: q.Match(q.Index('feedback_by_article_and_client'), [
          article,
          client
        ]),
        allFeedback: q.Paginate(
          q.Match(q.Index('feedback_by_article'), article)
        )
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
        ),
        clientFeedbackCount: q.If(
          q.Exists(q.Var('clientFeedback')),
          q.Select(['data', 'count'], q.Get(q.Var('clientFeedback'))),
          null as any
        )
      }
    )
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
}

async function updateNativeFeedback(
  article: string,
  client: string,
  count: number
): Promise<void> {
  const secret = process.env.FAUNA_SECRET
  if (!secret) {
    throw new Error('Missing Fauna Secret')
  }
  await new FaunaClient({ secret }).query(
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
    )
  )
}
