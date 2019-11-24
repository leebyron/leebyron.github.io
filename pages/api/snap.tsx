import chrome from 'chrome-aws-lambda'
import { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const host =
    (process.env.NODE_ENV === 'production' ? 'https://' : 'http://') +
    req.headers.host
  const { article, selection } = req.query
  const browser = await puppeteer.launch({
    // headless: false,
    defaultViewport: { width: 450, height: 225, deviceScaleFactor: 3 },
    args: process.env.NODE_ENV === 'production' ? chrome.args : undefined,
    executablePath:
      process.env.NODE_ENV === 'production'
        ? await chrome.executablePath
        : undefined
  })

  try {
    const page = await browser.newPage()
    try {
      const response = await page.goto(
        selection
          ? `${host}/${article}?screenshot=1&$=${selection}`
          : `${host}/${article}?screenshot=1`,
        { waitUntil: 'networkidle2' }
      )

      // If snapped page isn't 200, then forward the status.
      if (!response || !response.ok()) {
        res.statusCode = response ? response.status() : 500
        return res.end()
      }

      if (selection) {
        await page.addStyleTag({
          content: `
        * {
          color: #aaaaaa !important;
        }

        ::selection {
          background-color: #fff181;
          color: black;
        }`
        })
      }
      const buffer = await page.screenshot()
      res.statusCode = 200
      res.setHeader('Cache-Control', 'max-age=0, s-maxage=86400')
      res.setHeader('Content-Type', 'image/png')
      res.end(buffer)
    } finally {
      await page.close()
    }
  } finally {
    await browser.close()
  }
}
