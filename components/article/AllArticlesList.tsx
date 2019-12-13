import Link from 'next/link'
import { allFrontMatter } from './frontMatter'
import { shortDate } from './dateUtil'

export function AllArticlesList({ exclude }: { exclude?: string }) {
  return (
    <ul className="additionalReading">
      <style jsx>{`
        .additionalReading li {
          margin-bottom: 1rem;
        }

        .additionalReading a {
          text-decoration: none;
        }

        .additionalReading a:hover {
          text-decoration: underline;
        }

        .additionalReading em {
          display: block;
          opacity: 0.6;
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
