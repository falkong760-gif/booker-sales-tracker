import sys
import os
import asyncio
from playwright.async_api import async_playwright

async def verify_bookers_flow():
    print("Launching Playwright...")
    async with async_playwright() as p:
        # Launch browser headlessly
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
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

        # Click login button
        print("Submitting login form...")
        await page.click("button[type='submit']")

        # Wait for redirect to /dashboard
        print("Waiting for redirection to /dashboard...")
        try:
            await page.wait_for_url("**/dashboard", timeout=10000)
        except Exception as e:
            print(f"Redirection timed out: {e}")
            sys.exit(1)

        current_url = page.url
        print(f"Current URL after login: {current_url}")

        # Now navigate to /bookers
        print("Navigating to /bookers ...")
        await page.goto("http://localhost:3003/bookers")
        await page.wait_for_timeout(3000)

        current_url = page.url
        print(f"Current URL on Bookers page: {current_url}")
        if "/bookers" not in current_url:
            print("Failed to navigate to bookers page. Exiting.")
            sys.exit(1)

        # Capture initial screenshot (with database loading complete)
        screenshot_path_empty = "/home/jules/verification/bookers_empty_or_live_light.png"
        print(f"Capturing initial bookers list screenshot: {screenshot_path_empty}")
        os.makedirs(os.path.dirname(screenshot_path_empty), exist_ok=True)
        await page.screenshot(path=screenshot_path_empty)

        # Check for 'Add Booker' button and click it to open drawer
        print("Clicking 'Add Booker' button to open slide-over panel...")
        await page.click("button:has-text('Add Booker')")
        await page.wait_for_timeout(1000)

        # Take screenshot of Slide-over panel (Drawer)
        screenshot_path_drawer = "/home/jules/verification/bookers_add_drawer.png"
        print(f"Capturing screenshot of slide-over drawer: {screenshot_path_drawer}")
        await page.screenshot(path=screenshot_path_drawer)

        # Fill the form
        import random
        random_num = random.randint(1000, 9999)
        test_email = f"test_booker_{random_num}@gmail.com"
        print(f"Filling out new booker form with email: {test_email} ...")
        await page.fill("input[placeholder='e.g. Hammad Khan']", f"Test Booker {random_num}")
        await page.fill("input[placeholder='e.g. hammad@gmail.com']", test_email)
        await page.fill("input[placeholder='e.g. +92 300 1234567']", "+92 300 9876543")

        # Click Save Profile
        print("Clicking 'Save Profile' to create booker...")
        await page.click("button:has-text('Save Profile')")
        await page.wait_for_timeout(4000)

        # Check if the toast notification is displayed
        body_text = await page.inner_text("body")
        if "Booker profile created in database successfully!" in body_text:
            print("SUCCESS: Booker creation banner displayed perfectly!")
        else:
            print("Warning: Success banner text not found in page body.")

        # Capture bookers list with newly created simulated booker
        screenshot_path_created = "/home/jules/verification/bookers_created_list.png"
        print(f"Capturing screenshot of updated bookers list: {screenshot_path_created}")
        await page.screenshot(path=screenshot_path_created)

        # Search for this booker
        print(f"Testing real-time search for email: {test_email}...")
        await page.fill("input[placeholder='Search by name or email...']", test_email)
        await page.wait_for_timeout(1000)

        screenshot_path_search = "/home/jules/verification/bookers_searched.png"
        print(f"Capturing screenshot of filtered search: {screenshot_path_search}")
        await page.screenshot(path=screenshot_path_search)

        # Clear search
        await page.fill("input[placeholder='Search by name or email...']", "")
        await page.wait_for_timeout(1000)

        # Deactivate booker
        print("Testing deactivation flow...")
        # Find the newly added card and click Deactivate
        await page.click(f"div:has-text('{test_email}') button:has-text('Deactivate')")
        await page.wait_for_timeout(1000)
        # Click 'Yes' to confirm deactivation
        print("Confirming deactivation...")
        await page.click(f"div:has-text('{test_email}') button:has-text('Yes')")
        await page.wait_for_timeout(2000)

        # Check if toast appeared
        body_text = await page.inner_text("body")
        if "Booker has been successfully deactivated." in body_text:
            print("SUCCESS: Deactivation banner displayed!")
        else:
            print("Warning: Deactivation banner not found in page body.")

        # Capture deactivation view
        screenshot_path_deactivated = "/home/jules/verification/bookers_deactivated.png"
        print(f"Capturing screenshot after deactivation: {screenshot_path_deactivated}")
        await page.screenshot(path=screenshot_path_deactivated)

        # Toggle to Inactive tab
        print("Switching to Inactive Tab...")
        await page.click("button:has-text('Inactive')")
        await page.wait_for_timeout(1500)

        # Confirm reactivation
        print("Testing reactivation flow...")
        await page.click(f"div:has-text('{test_email}') button:has-text('Reactivate')")
        await page.wait_for_timeout(1000)
        await page.click(f"div:has-text('{test_email}') button:has-text('Yes')")
        await page.wait_for_timeout(2000)

        # Capture final list state (All tab)
        print("Switching back to All Tab...")
        await page.click("button:has-text('All')")
        await page.wait_for_timeout(1500)

        screenshot_path_final = "/home/jules/verification/bookers_final_state.png"
        print(f"Capturing final verified state: {screenshot_path_final}")
        await page.screenshot(path=screenshot_path_final)

        print("Playwright flow successfully complete!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_bookers_flow())
