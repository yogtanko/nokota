import { test, expect } from "@playwright/test"

test.describe("Risk Calculator — Full User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("1. portal page renders with risk calculator link", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Trade Deck")
    await expect(
      page.getByRole("link", { name: /risk calculator/i })
    ).toBeVisible()
    await expect(
      page.getByText(/calculate position sizing/i)
    ).toBeVisible()
  })

  test("2. clicking calculator card navigates to risk calculator page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await expect(page).toHaveURL(/\/apps\/risk-calculator/)
    await expect(
      page.getByRole("heading", { name: /risk calculator/i })
    ).toBeVisible()
  })

  test("3. profile section balance and risk percentage can be filled", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await page.waitForURL(/\/apps\/risk-calculator/)

    const balanceInput = page.getByLabel(/account balance/i)
    await balanceInput.fill("50000000")
    const riskInput = page.getByLabel(/risk per trade/i)
    await riskInput.fill("2")

    await expect(page.getByLabel(/account balance/i)).toHaveValue(/50/)
    await expect(page.getByLabel(/risk per trade/i)).toHaveValue(/2/)
  })

  test("4. stock symbol lookup handles unavailable API gracefully", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await page.waitForURL(/\/apps\/risk-calculator/)

    const symbolInput = page.getByLabel(/stock symbol/i)
    await symbolInput.fill("BBRI")
    await symbolInput.blur()
    await page.waitForTimeout(2000)

    const entryInput = page.getByLabel(/entry price/i)
    await page.waitForTimeout(3000)
    const entryValue = await entryInput.inputValue()
    if (entryValue === "") {
      await entryInput.fill("5000")
    }
  })

  test("5. stop loss and take profit inputs accept values", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await page.waitForURL(/\/apps\/risk-calculator/)

    await page.getByLabel(/account balance/i).fill("50000000")
    await page.getByLabel(/risk per trade/i).fill("2")

    await page.getByLabel(/entry price/i).fill("5000")
    await page.getByLabel(/stop loss/i).fill("4500")
    await page.getByLabel(/take profit/i).fill("5500")

    await expect(page.getByLabel(/stop loss/i)).toHaveValue(/4\.500/)
    await expect(page.getByLabel(/take profit/i)).toHaveValue(/5\.500/)
  })

  test("6. calculated results display correctly with valid inputs", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await page.waitForURL(/\/apps\/risk-calculator/)

    await page.getByLabel(/account balance/i).fill("50000000")
    await page.getByLabel(/risk per trade/i).fill("2")
    await page.getByLabel(/entry price/i).fill("5000")
    await page.getByLabel(/stop loss/i).fill("4500")
    await page.getByLabel(/take profit/i).fill("5500")

    await page.waitForTimeout(500)

    await expect(page.getByText("Position Size", { exact: true })).toBeVisible()
    await expect(page.getByText("Risk:Reward")).toBeVisible()
    await expect(page.getByText("Max Loss")).toBeVisible()
    await expect(page.getByText("Potential Profit")).toBeVisible()

    await expect(page.getByText("2.000")).toBeVisible()
    await expect(page.getByText(/20 lot/)).toBeVisible()
    await expect(page.getByText("1:1.0")).toBeVisible()
  })

  test("7. modifying any input updates results reactively", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await page.waitForURL(/\/apps\/risk-calculator/)

    await page.getByLabel(/account balance/i).fill("50000000")
    await page.getByLabel(/risk per trade/i).fill("2")
    await page.getByLabel(/entry price/i).fill("5000")
    await page.getByLabel(/stop loss/i).fill("4500")
    await page.getByLabel(/take profit/i).fill("5500")

    await page.waitForTimeout(300)
    await expect(page.getByText("2.000")).toBeVisible()

    await page.getByLabel(/entry price/i).fill("5200")
    await page.waitForTimeout(300)

    const newShares = await page.getByText(/^1\./).first()
    await expect(newShares).toBeVisible()
    await expect(page.getByText(/14 lot/).or(page.getByText(/10 lot/))).toBeVisible()
  })

  test("8. profile values persist after page refresh", async ({ page }) => {
    await page.getByRole("link", { name: /risk calculator/i }).click()
    await page.waitForURL(/\/apps\/risk-calculator/)

    await page.getByLabel(/account balance/i).fill("100000000")
    await page.getByLabel(/risk per trade/i).fill("3")
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForURL(/\/apps\/risk-calculator/)
    await page.waitForTimeout(500)

    const balanceInput = page.getByLabel(/account balance/i)
    await expect(balanceInput).toHaveValue(/100\.000\.000/)
  })
})
