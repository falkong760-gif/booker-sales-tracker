import sys
import os
import asyncio
import re
from playwright.async_api import async_playwright

async def verify_booker_detail_flow():
    print("Launching Playwright...")
    async with async_playwright() as p:
        # Launch browser headlessly
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1000})
        page = await context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"[BROWSER CONSOLE] {msg.type}: {msg.text}"))

        # Nav to Login
        print("Navigating to http://localhost:3003/login ...")
        await page.goto("http://localhost:3003/login")
        await page.wait_for_timeout(2000)

        # Fill credentials
        print("Entering credentials...")
        await page.fill("#email", "booker@gmail.com")
        await page.fill("#password", "booker@@")
        await page.click("button[type='submit']")

        # Wait for redirect to /dashboard
        print("Waiting for redirection to /dashboard...")
        await page.wait_for_url("**/dashboard", timeout=12000)

        # Navigate to /bookers
        print("Navigating to /bookers ...")
        await page.goto("http://localhost:3003/bookers")
        await page.wait_for_timeout(3000)

        # Let's find one of the bookers from the list to click on.
        print("Locating booker detail link...")
        detail_locator = page.locator("a[href^='/bookers/']").first
        href = await detail_locator.get_attribute("href")
        print(f"Found booker detail link: {href}")

        if not href:
            print("No booker found. Creating one first.")
            # Let's click Add Booker
            await page.click("button:has-text('Add Booker')")
            await page.wait_for_timeout(500)
            await page.fill("input[placeholder='e.g. Hammad Khan']", "Syed Zulqarnain")
            await page.fill("input[placeholder='e.g. hammad@gmail.com']", f"syed_{os.urandom(2).hex()}@gmail.com")
            await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 300 1234567")
            await page.click("button:has-text('Save Profile')")
            await page.wait_for_timeout(2000)
            detail_locator = page.locator("a[href^='/bookers/']").first
            href = await detail_locator.get_attribute("href")
            print(f"Created and found new booker link: {href}")

        # Navigate directly to the details page
        await page.goto(f"http://localhost:3003{href}")
        await page.wait_for_timeout(4000)

        print(f"Arrived on Booker Detail Page: {page.url}")

        # Let's clean out any existing entries so we can add fresh test entries deterministically
        # For each delete action currently visible, let's click it to confirm a fresh slate
        delete_buttons = await page.locator("button[title='Delete entry']").all()
        for _ in range(len(delete_buttons)):
            btn_locator = page.locator("button[title='Delete entry']").first
            await btn_locator.click()
            await page.wait_for_timeout(300)
            await page.click("button:has-text('Yes')")
            await page.wait_for_timeout(1000)

        # Let's enter a fresh entry: Today's date with a Shortfall (Sale: 100000, Deposit: 40000 -> Shortfall: 60000)
        print("Entering first daily entry (shortfall)...")
        # Let's keep the default today's date
        await page.fill("input[type='number'] >> nth=0", "100000")
        await page.fill("input[type='number'] >> nth=1", "40000")
        await page.fill("textarea[placeholder*='e.g. Received']", "Initial booking order - pending collection")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(2000)

        # Let's enter a second entry for yesterday: Excess (Sale: 50000, Deposit: 70000 -> Excess: -20000)
        print("Entering second daily entry (excess)...")
        # Change the date back by 1 day
        today = await page.locator("input[type='date']").input_value()
        # Find yesterday YYYY-MM-DD
        year, month, day = map(int, today.split('-'))
        import datetime
        yesterday = (datetime.date(year, month, day) - datetime.timedelta(days=1)).isoformat()
        await page.fill("input[type='date']", yesterday)
        await page.wait_for_timeout(500)
        await page.fill("input[type='number'] >> nth=0", "50000")
        await page.fill("input[type='number'] >> nth=1", "70000")
        await page.fill("textarea[placeholder*='e.g. Received']", "Cleared backlog pending balance")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(2000)

        # Let's capture the auto-prefill safeguard notice by selecting 'today' again in the date input
        print("Selecting today's date again to trigger auto-prefill safeguard notice...")
        await page.fill("input[type='date']", today)
        await page.wait_for_timeout(1000)

        screenshot_safeguard = "./verification/11_safeguard_warning_light.png"
        print(f"Capturing screenshot of safeguard pre-fill warning: {screenshot_safeguard}")
        await page.screenshot(path=screenshot_safeguard)

        # Clear/reset to make sure input warning is clean for full layout
        await page.click("button:has-text('Clear')")
        await page.wait_for_timeout(1000)

        # Take Light Mode Screenshot
        screenshot_detail_light = "./verification/12_booker_detail_light.png"
        print(f"Capturing screenshot of Booker Detail Page (Light Mode): {screenshot_detail_light}")
        await page.screenshot(path=screenshot_detail_light)

        # Toggle Dark Mode
        print("Toggling dark mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1000)

        screenshot_detail_dark = "./verification/13_booker_detail_dark.png"
        print(f"Capturing screenshot of Booker Detail Page (Dark Mode): {screenshot_detail_dark}")
        await page.screenshot(path=screenshot_detail_dark)

        # Toggle back to light
        print("Toggling back to light mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(500)

        # Set mobile viewport (375x1300 to capture vertical stacking)
        print("Setting viewport to mobile size (375x1300)...")
        await page.set_viewport_size({"width": 375, "height": 1400})
        await page.wait_for_timeout(1000)

        screenshot_detail_mobile = "./verification/14_booker_detail_mobile.png"
        print(f"Capturing screenshot of mobile Booker Detail: {screenshot_detail_mobile}")
        await page.screenshot(path=screenshot_detail_mobile)

        print("Verification complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_booker_detail_flow())
