const { chromium } = require('playwright');
const slots = require('../slots.json');

(async () => {
  // Launch in headless mode for compatibility with GitHub Actions
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let newPage; // Declare here to be accessible in catch block

  try {
    // --- Navigation ---
    await page.goto('https://centrefairplay.ch/le-centre');
    const page1Promise = context.waitForEvent('page');
    await page.getByRole('link', { name: 'Réservations' }).click();
    newPage = await page1Promise; // Assign here
    await newPage.waitForLoadState();
    await newPage.getByRole('link', { name: 'Padel' }).click();
    console.log('Successfully navigated to the Padel booking page.');

    // --- Dynamic Date Selection ---
    const targetDay = slots.day;
    const dayMapping = {
      "Monday": "Lundi", "Tuesday": "Mardi", "Wednesday": "Mercredi",
      "Thursday": "Jeudi", "Friday": "Vendredi", "Saturday": "Samedi", "Sunday": "Dimanche"
    };
    const targetDayFrenchAbbr = dayMapping[targetDay].slice(0, 2);
    await newPage.getByText(new RegExp(`^${targetDayFrenchAbbr}`)).last().click();
    console.log(`Selected day: ${targetDay}`);

    // --- Dynamic Slot Selection & Booking ---
    const availableSlotsSelector = "div.cases-et-demi[title='']";
    await newPage.waitForSelector(availableSlotsSelector);
    const slotsCount = await newPage.locator(availableSlotsSelector).count();
    console.log(`Found ${slotsCount} available slots.`);

    let booked = false;
    for (let i = 0; i < slotsCount; i++) {
      // Re-fetch the locator in each iteration to avoid stale element issues
      await newPage.locator(availableSlotsSelector).nth(i).click();
      
      // Wait for a moment and check if the slot is locked by another user
      await newPage.waitForTimeout(2000);
      const isLocked = await newPage.locator('text="Une autre personne est en"').count() > 0;

      if (isLocked) {
        console.log('Slot is locked by another user. Going back.');
        await newPage.getByRole('link', { name: 'Retour au tableau.' }).click();
        await newPage.waitForSelector(availableSlotsSelector);
        continue; // Move to the next available slot
      }

      // If not locked, proceed to check the time
      const timeSelector = 'span.button-text:has-text("juillet")';
      await newPage.waitForSelector(timeSelector);
      const timeText = await newPage.locator(timeSelector).textContent();
      const time = timeText.split(' à ')[1];
      console.log(`Checking slot at ${time}...`);

      if (slots.times.includes(time)) {
        console.log(`Found a desired slot at ${time}! Proceeding with booking.`);
        
        // --- Login and Booking Flow (from Codegen) ---
        await newPage.getByLabel('Numéro de joueur').fill(process.env.PLAYER_NUMBER);
        await newPage.locator('#pwd').fill(process.env.PASSWORD);
        await newPage.getByRole('button', { name: 'OK' }).click();
        
        await newPage.getByPlaceholder('Entrez quelques lettres...').fill(process.env.SECOND_PLAYER);
        await newPage.getByRole('button', { name: 'OK' }).click();
        
        await newPage.getByRole('button', { name: 'Continuer' }).click();
        
        // --- Final Confirmation and Payment ---
        await newPage.getByRole('button', { name: 'Continuer' }).click();
        await newPage.waitForURL('**/paiement.php**');
        await newPage.locator('#cbx').check();
        console.log('Accepted payment conditions.');

        // We will stop here, before navigating to the final payment gateway.
        console.log(`Successfully booked slot for ${time}!`);
        booked = true;
        break;
      } else {
        console.log('Not the right time, going back.');
        await newPage.goBack();
        // Add a small delay to ensure the page is ready
        await newPage.waitForSelector(availableSlotsSelector);
      }
    }

    if (!booked) {
      console.log('Could not find any of the desired time slots.');
    }

    console.log('Booking script finished.');
    await newPage.waitForTimeout(5000);

  } catch (error) {
    console.error('An error occurred:', error);
    // Safety mechanism: try to cancel any pending reservation
    try {
      if (newPage && !newPage.isClosed()) {
        console.log('Attempting to cancel any pending reservation...');
        await newPage.getByRole('button', { name: 'Annuler' }).click({ timeout: 5000 });
        console.log('Cancellation button clicked.');
      }
    } catch (cancelError) {
      // It's okay if the cancel button isn't found, it means there's nothing to cancel.
      console.log('No active reservation to cancel.');
    }
  } finally {
    await browser.close();
  }
})();
