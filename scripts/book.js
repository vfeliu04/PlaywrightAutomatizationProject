require('dotenv').config();
const { chromium } = require('playwright');
const slots = require('../slots.json');

(async () => {
  // Launch in headless mode for compatibility with GitHub Actions
  const browser = await chromium.launch({ headless: false });
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

    // --- Dynamic Slot Selection & Booking (Multi-slot logic) ---
    let bookedCount = 0;
    const desiredTimes = slots.times;

    for (const timeToBook of desiredTimes) {
      console.log(`\n--- Searching for slot: ${timeToBook} ---`);
      
      const availableSlotsSelector = "div.cases-et-demi[title='']";
      await newPage.waitForSelector(availableSlotsSelector);
      const slotsCount = await newPage.locator(availableSlotsSelector).count();
      
      if (slotsCount === 0) {
        console.log("No available slots found on the page.");
        continue;
      }
      
      let foundAndBooked = false;
      for (let i = 0; i < slotsCount; i++) {
        // Re-fetch locator to avoid stale element issues
        await newPage.locator(availableSlotsSelector).nth(i).click();

        // Handle if slot is locked by another user
        const isLocked = await newPage.locator('text="Une autre personne est en train de réserver cette période"').count() > 0;
        if (isLocked) {
          console.log('Slot is locked by another user. Going back.');
          await newPage.getByRole('link', { name: 'Retour au tableau.' }).click();
          await newPage.waitForSelector(availableSlotsSelector);
          continue;
        }

        // Check if the time matches
        const timeSelector = 'span.button-text:has-text("juillet")';
        await newPage.waitForSelector(timeSelector);
        const timeText = await newPage.locator(timeSelector).textContent();
        const time = timeText.split(' à ')[1];
        
        if (time === timeToBook) {
          console.log(`Found matching slot at ${time}. Proceeding with booking.`);
          
          await newPage.getByLabel('Numéro de joueur').fill(process.env.PLAYER_NUMBER);
          await newPage.locator('#pwd').fill(process.env.PASSWORD);
          await newPage.getByRole('button', { name: 'OK' }).click();
          
          await newPage.getByPlaceholder('Entrez quelques lettres...').fill(process.env.SECOND_PLAYER);
          await newPage.getByRole('button', { name: 'OK' }).click();
          
          await newPage.getByRole('button', { name: 'Continuer' }).click();
          await newPage.getByRole('button', { name: 'Continuer' }).click();
          await newPage.waitForURL('**/paiement.php**');
          await newPage.locator('#cbx').check();
          await newPage.getByRole('button', { name: 'Valider le mode de paiement' }).click();

          // Fill in payment details
          await newPage.getByLabel('Account holder').fill(process.env.CARD_HOLDER);
          await newPage.getByLabel('Card number').fill(process.env.CARD_NUMBER);
          await newPage.getByLabel('Expiry date').fill(process.env.CARD_EXPIRY);
          await newPage.getByRole('button', { name: 'Payer' }).click();
          
          console.log(`Successfully filled payment details for ${time}!`);
          bookedCount++;
          foundAndBooked = true;

          // Booking complete, navigate back to the main schedule for the next desired time
          console.log("Returning to schedule for next booking...");
          await page.goto('https://centrefairplay.ch/le-centre');
          const page1Promise = context.waitForEvent('page');
          await page.getByRole('link', { name: 'Réservations' }).click();
          newPage = await page1Promise; // Assign here
          await newPage.waitForLoadState();
          await newPage.getByRole('link', { name: 'Padel' }).click();
          await newPage.getByText(new RegExp(`^${targetDayFrenchAbbr}`)).last().click();
          break; // Exit inner loop and move to the next timeToBook
        } else {
          console.log(`Slot at ${time} is not the desired time. Going back.`);
          await newPage.goBack();
          await newPage.waitForSelector(availableSlotsSelector);
        }
      }
      
      if (!foundAndBooked) {
        console.log(`Could not find an available slot for ${timeToBook}.`);
      }
    }

    console.log(`\nBooking process finished. Successfully booked ${bookedCount} slots.`);

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
