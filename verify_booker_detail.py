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
        # Larger height to capture the full page with no cropping
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
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

        # Let's create a fresh booker so we can deterministically test everything
        print("Creating a fresh booker to verify detail visuals...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(1000)

        unique_id = os.urandom(3).hex()
        test_email = f"detail_test_{unique_id}@gmail.com"
        await page.fill("input[placeholder='e.g. Hammad Khan']", f"Syed Verification {unique_id}")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", test_email)
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 301 1122334")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(3000)

        # Locate the detail link of this newly created booker
        print("Searching for the newly created booker...")
        await page.fill("input[placeholder='Search by name or email...']", test_email)
        await page.wait_for_timeout(1000)

        detail_locator = page.locator("a[href^='/bookers/']").first
        href = await detail_locator.get_attribute("href")
        print(f"Booker link: {href}")

        # Navigate directly to the details page
        await page.goto(f"http://localhost:3003{href}")
        await page.wait_for_timeout(4000)

        print(f"Arrived on Booker Detail Page: {page.url}")

        # Take Empty State Screenshot (Light Mode)
        screenshot_empty = "./verification/15_empty_states_light.png"
        print(f"Capturing screenshot of Empty States Booker Detail Page: {screenshot_empty}")
        await page.screenshot(path=screenshot_empty)

        # --- NOW ADD FRESH ENTRIES ---
        # 1. Today's date with a Shortfall (Sale: 100,000, Deposit: 40,000 -> Shortfall: 60,000)
        print("Entering first daily entry (shortfall)...")
        await page.fill("input[type='number'] >> nth=0", "100000")
        await page.fill("input[type='number'] >> nth=1", "40000")
        await page.fill("textarea[placeholder*='e.g. Received']", "Initial booking order")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(2000)

        # 2. Yesterday: Excess (Sale: 50,000, Deposit: 70,000 -> Excess: -20,000)
        print("Entering second daily entry (excess)...")
        today = await page.locator("input[type='date']").input_value()
        year, month, day = map(int, today.split('-'))
        import datetime
        yesterday = (datetime.date(year, month, day) - datetime.timedelta(days=1)).isoformat()
        await page.fill("input[type='date']", yesterday)
        await page.wait_for_timeout(500)
        await page.fill("input[type='number'] >> nth=0", "50000")
        await page.fill("input[type='number'] >> nth=1", "70000")
        await page.fill("textarea[placeholder*='e.g. Received']", "Cleared backlog")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(2000)

        # --- TEST TOAST BUG FIX: EDIT AN ENTRY ---
        print("Clicking 'Edit' on the ledger row for yesterday's entry...")
        edit_btn = page.locator("button[title='Edit entry']").last
        await edit_btn.click()
        await page.wait_for_timeout(1000)

        # Date input should pre-fill with yesterday's date
        date_val = await page.locator("input[type='date']").input_value()
        print(f"Date input holds: {date_val} (expected: {yesterday})")

        # Change Sale Amount to 65000 and click Save
        print("Changing Sale Amount to 65000 to trigger 'Entry updated for' toast...")
        await page.fill("input[type='number'] >> nth=0", "65000")
        await page.click("button:has-text('Save Entry')")
        await page.wait_for_timeout(500) # Quick capture during active toast representation

        screenshot_toast = "./verification/16_update_toast_match.png"
        print(f"Capturing screenshot of updated toast showing correct matching date: {screenshot_toast}")
        await page.screenshot(path=screenshot_toast)
        await page.wait_for_timeout(1500) # Let toast finish

        # --- HOVER TO SHOW THE CUSTOM GLASS TOOLTIP ON AREA CHART ---
        print("Locating dot element in AreaChart to show custom frosted-glass tooltip...")
        try:
            dots = page.locator(".recharts-area-dots circle")
            await dots.first.hover()
            await page.wait_for_timeout(1000)
            print("Successfully hovered over Area Chart dot.")
        except Exception as err:
            print(f"Could not hover Area Chart dot: {err}")

        # Take Light Mode Screenshot with tooltip visible, no header crop!
        screenshot_detail_light = "./verification/12_booker_detail_light.png"
        print(f"Capturing screenshot of Booker Detail Page (Light Mode) with Area Tooltip: {screenshot_detail_light}")
        await page.screenshot(path=screenshot_detail_light)

        # --- HOVER TO SHOW THE CUSTOM GLASS TOOLTIP ON BAR CHART ---
        print("Locating bar element in Bar Chart to show custom frosted-glass tooltip...")
        try:
            bars = page.locator(".recharts-bar-rectangle").first
            await bars.hover()
            await page.wait_for_timeout(1000)
            screenshot_bar_tooltip = "./verification/17_bar_chart_tooltip.png"
            print(f"Capturing screenshot of Bar Chart tooltip: {screenshot_bar_tooltip}")
            await page.screenshot(path=screenshot_bar_tooltip)
        except Exception as err:
            print(f"Could not hover Bar: {err}")

        # --- HOVER TO SHOW ACCESSIBLE DATE + AMOUNT TOOLTIP ON HEATMAP ---
        print("Locating day block in Heatmap to show accessible floating tooltip...")
        try:
            # Heatmap blocks are simple styled divs. We can hover one with a specific background class
            heatmap_block = page.locator("div[onmouseenter]").first
            await heatmap_block.hover()
            await page.wait_for_timeout(1000)
            screenshot_heatmap_tooltip = "./verification/18_heatmap_tooltip.png"
            print(f"Capturing screenshot of Heatmap floating accessible tooltip: {screenshot_heatmap_tooltip}")
            await page.screenshot(path=screenshot_heatmap_tooltip)
        except Exception as err:
            print(f"Could not hover Heatmap block: {err}")

        # Toggle Dark Mode
        print("Toggling dark mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(1000)

        # Hover again in Dark Mode to show the dark themed frosted glass tooltip!
        try:
            dots_dark = page.locator(".recharts-area-dots circle")
            await dots_dark.first.hover()
            await page.wait_for_timeout(1000)
        except Exception:
            pass

        screenshot_detail_dark = "./verification/13_booker_detail_dark.png"
        print(f"Capturing screenshot of Booker Detail Page (Dark Mode): {screenshot_detail_dark}")
        await page.screenshot(path=screenshot_detail_dark)

        # Toggle back to light
        print("Toggling back to light mode...")
        await page.click("button[aria-label='Toggle theme mode']")
        await page.wait_for_timeout(500)

        # Set mobile viewport with extra tall height to show everything vertically without any truncating
        print("Setting viewport to mobile size (375x3200) to capture full scroll completeness...")
        await page.set_viewport_size({"width": 375, "height": 3200})
        await page.wait_for_timeout(1000)

        screenshot_detail_mobile = "./verification/14_booker_detail_mobile.png"
        print(f"Capturing screenshot of mobile Booker Detail: {screenshot_detail_mobile}")
        await page.screenshot(path=screenshot_detail_mobile)

        print("Verification complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_booker_detail_flow())
