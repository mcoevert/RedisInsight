import { rte } from '../../../helpers/constants';
import { deleteDatabase, acceptTermsAddDatabaseOrConnectToRedisStack } from '../../../helpers/database';
import { BrowserPage } from '../../../pageObjects';
import { commonUrl, ossStandaloneConfig } from '../../../helpers/conf';
import { Common } from '../../../helpers/common';

const browserPage = new BrowserPage();

let keyName = Common.generateWord(10);
const keyTTL = '2147476121';
const element = '1111listElement11111';
const element2 = '2222listElement22222';
const element3 = '33333listElement33333';

fixture `List Key verification`
    .meta({ type: 'smoke', rte: rte.standalone })
    .page(commonUrl)
    .beforeEach(async() => {
        await acceptTermsAddDatabaseOrConnectToRedisStack(ossStandaloneConfig, ossStandaloneConfig.databaseName);
    })
    .afterEach(async() => {
        // Clear and delete database
        await browserPage.deleteKeyByName(keyName);
        await deleteDatabase(ossStandaloneConfig.databaseName);
    });
test('Verify that user can select remove List element position: from tail', async t => {
    keyName = Common.generateWord(10);
    await browserPage.addListKey(keyName, keyTTL);
    // Add few elements to the List key
    await browserPage.addElementToList(element);
    // Verify that user can add element to List
    await t.expect(browserPage.listElementsList.withExactText(element).exists).ok('The list element not added', { timeout: 10000 });

    await browserPage.addElementToList(element2);
    await browserPage.addElementToList(element3);
    // Remove element from the key
    await browserPage.removeListElementFromTail('1');
    // Check the notification message
    const notification = await browserPage.getMessageText();
    await t.expect(notification).contains('Elements have been removed', 'The notification not found');
    // Check the removed element is not in the list
    await t.expect(browserPage.listElementsList.withExactText(element3).exists).notOk('The list element not removed', { timeout: 10000 });
});
test('Verify that user can select remove List element position: from head', async t => {
    keyName = Common.generateWord(10);
    await browserPage.addListKey(keyName, keyTTL, element);
    // Add few elements to the List key
    await browserPage.addElementToList(element2);
    await browserPage.addElementToList(element3);
    // Remove element from the key
    await browserPage.removeListElementFromHead('1');
    // Check the notification message
    const notofication = await browserPage.getMessageText();
    await t.expect(notofication).contains('Elements have been removed', 'The notification not found');
    // Check the removed element is not in the list
    await t.expect(browserPage.listElementsList.withExactText(element).exists).notOk('The list element not removed', { timeout: 10000 });
});
