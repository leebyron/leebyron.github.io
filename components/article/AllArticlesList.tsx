import Link from 'next/link'
import { allFrontMatter } from './frontMatter'
import { shortDate } from './dateUtil'

export function AllArticlesList({ exclude }: { exclude?: string }) {
  return (
    <ul className="allArticles">
      <style jsx>{`
        ul {
          padding-inline-start: 0;
        }

        li {
          margin-bottom: 1rem;
        }

        li::before {
          opacity: 0.6;
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          li::before {
            display: none;
          }
        }

        a {
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        em {
          color: #767676;
          display: block;
        }
      `}</style>
      {allFrontMatter().map(
        frontMatter =>
          frontMatter.slug !== exclude && (
            <li key={frontMatter.slug}>
              <Link href={`/${frontMatter.slug}`}>
                <a>{frontMatter.title}</a>
              </Link>
              <em>{`${Math.round(
                frontMatter.wordCount / 250
              )} min read · ${shortDate(frontMatter.date)}`}</em>
            </li>
          )
      )}
    </ul>
  )
}
