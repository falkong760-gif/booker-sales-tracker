import sys
import os
import asyncio
from playwright.async_api import async_playwright

async def verify_search_clean():
    print("Launching Playwright...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        print("Navigating to http://localhost:3003/login ...")
        await page.goto("http://localhost:3003/login")
        await page.wait_for_timeout(2000)

        print("Entering credentials...")
        await page.fill("#email", "booker@gmail.com")
        await page.fill("#password", "booker@@")

        print("Submitting login form...")
        await page.click("button[type='submit']")

        try:
            await page.wait_for_url("**/dashboard", timeout=12000)
        except Exception as e:
            print(f"Redirection timed out: {e}")
            sys.exit(1)

        print("Navigating to /bookers ...")
        await page.goto("http://localhost:3003/bookers")
        await page.wait_for_timeout(3000)

        os.makedirs("./verification", exist_ok=True)

        # Clear any search text first
        await page.fill("input[placeholder='Search by name or email...']", "")
        await page.wait_for_timeout(1000)

        # 1. Clean Search by Name
        print("Filtering list by name: 'Zulqarnain' with drawer closed...")
        await page.fill("input[placeholder='Search by name or email...']", "Zulqarnain")
        await page.wait_for_timeout(1500)
        screenshot_search_name = "./verification/09_search_by_name_clean.png"
        await page.screenshot(path=screenshot_search_name)
        print(f"Captured: {screenshot_search_name}")

        # 2. Clean Search by Email
        print("Filtering list by email: 'zulqarnain_test' with drawer closed...")
        await page.fill("input[placeholder='Search by name or email...']", "zulqarnain_test")
        await page.wait_for_timeout(1500)
        screenshot_search_email = "./verification/10_search_by_email_clean.png"
        await page.screenshot(path=screenshot_search_email)
        print(f"Captured: {screenshot_search_email}")

        print("Clean search verification complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_search_clean())
