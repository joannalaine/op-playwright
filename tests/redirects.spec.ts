import { test, expect, Browser, Page } from '@playwright/test';
import { chromium } from 'playwright';
import Airtable from 'airtable';

// TODO: API key and base ID available at https://airtable.com/api
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = "changeme";

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(BASE_ID);
const table = base("Redirects");

async function getRecordsFromAirtable(table, options = {}) {
  const recordsArray: string[][] = [];
  await table
    .select(options)
    .eachPage((records, fetchNextPage) => {
      records.forEach(({ fields }) => {
        recordsArray.push([
          fields.Original,
          fields.Redirect,
        ]);
      });
      fetchNextPage();
    })
    .catch((error) => {
      console.error(error);
      return false;
    });
  return recordsArray;
}

let browser: Browser;
let baseURL: string;
let page: Page;

test.beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  baseURL = "https://fromourplace.com";
});

test.describe('Redirects', () => {
  test('Redirects should work', async ({ page }) => {
    const records = await getRecordsFromAirtable(table);
    for (let index = 0; index < records.length; index++) {
      console.log("Testing: ", records[index]);
      const oldPath = records[index][0];
      const newPath = records[index][1];
      const response = await page.goto(`${baseURL}${oldPath}`);
      expect(response?.url()).toBe(`${baseURL}${newPath}`);
    }
  });
});

test.afterAll(async () => {
  await browser.close();
});
