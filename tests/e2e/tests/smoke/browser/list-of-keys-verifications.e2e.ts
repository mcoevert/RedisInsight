import { rte } from '../../../helpers/constants';
import { deleteDatabase, acceptTermsAddDatabaseOrConnectToRedisStack } from '../../../helpers/database';
import { BrowserPage } from '../../../pageObjects';
import { commonUrl, ossStandaloneConfig } from '../../../helpers/conf';
import { Common } from '../../../helpers/common';

const browserPage = new BrowserPage();

let keyName = Common.generateWord(10);
let keyNames: string[] = [];
const keyTTL = '2147476121';

fixture `List of keys verifications`
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
test
    .after(async() => {
        // Clear and delete database
        for(const name of keyNames) {
            await browserPage.deleteKeyByName(name);
        }
        await deleteDatabase(ossStandaloneConfig.databaseName);
    })('Verify that user can scroll List of Keys in DB', async t => {
        keyNames = [
            `key-${Common.generateWord(10)}`,
            `key-${Common.generateWord(10)}`,
            `key-${Common.generateWord(10)}`,
            `key-${Common.generateWord(10)}`
        ];

        await browserPage.addStringKey(keyNames[0]);
        await browserPage.addHashKey(keyNames[1]);
        await browserPage.addListKey(keyNames[2]);
        await browserPage.addStringKey(keyNames[3]);
        await t.click(browserPage.refreshKeysButton);
        // Verify that user can see List of Keys in DB
        await t.expect(browserPage.keyNameInTheList.exists).ok('The list of keys is not displayed');

        // Scroll to the key element
        await t.hover(browserPage.keyNameInTheList);
        await t.expect(browserPage.keyNameInTheList.exists).ok('The list of keys is not displayed');
    });
test('Verify that user can refresh Keys', async t => {
    keyName = Common.generateWord(10);
    const newKeyName = 'KeyNameAfterEdit!testKey';

    // Add hash key
    await browserPage.addHashKey(keyName, keyTTL);
    const notofication = await browserPage.getMessageText();
    await t.expect(notofication).contains('Key has been added', 'The notification is not displayed');
    await t.click(browserPage.closeKeyButton);
    // Search for the added key
    await browserPage.searchByKeyName(keyName);
    const isKeyIsDisplayedInTheList = await browserPage.isKeyIsDisplayedInTheList(keyName);
    await t.expect(isKeyIsDisplayedInTheList).eql(true, 'The key is not in the list');
    // Edit the key name in details
    await t.click(browserPage.keyNameInTheList);
    await browserPage.editKeyName(newKeyName);
    // Refresh Keys
    await t.click(browserPage.refreshKeysButton);
    await browserPage.searchByKeyName(keyName);
    const isKeyIsNotDisplayedInTheList = await browserPage.isKeyIsDisplayedInTheList(keyName);
    await t.expect(isKeyIsNotDisplayedInTheList).eql(false, 'The key is still in the list');
});
test('Verify that user can open key details', async t => {
    keyName = Common.generateWord(10);
    const keyValue = 'StringValue!';

    // Add String key
    await browserPage.addStringKey(keyName, keyTTL, keyValue);
    const notofication = await browserPage.getMessageText();
    await t.expect(notofication).contains('Key has been added', 'The notification is not displayed');
    await t.click(browserPage.closeKeyButton);
    // Search for the added key
    await browserPage.searchByKeyName(keyName);
    const isKeyIsDisplayedInTheList = await browserPage.isKeyIsDisplayedInTheList(keyName);
    await t.expect(isKeyIsDisplayedInTheList).ok('The key is not in the list');
    // Open the key details
    await t.click(browserPage.keyNameInTheList);
    const keyNameFromDetails = await browserPage.keyNameFormDetails.textContent;
    await t.expect(keyNameFromDetails).contains(keyName, 'The Key details is not opened');
});
