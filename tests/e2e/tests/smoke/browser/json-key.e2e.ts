import { rte } from '../../../helpers/constants';
import { deleteDatabase, acceptTermsAddDatabaseOrConnectToRedisStack } from '../../../helpers/database';
import { BrowserPage } from '../../../pageObjects';
import { commonUrl, ossStandaloneConfig } from '../../../helpers/conf';
import { Common } from '../../../helpers/common';

const browserPage = new BrowserPage();

let keyName = Common.generateWord(10);
const keyTTL = '2147476121';
const value = '{"name":"xyz"}';
const jsonObjectValue = '{name:"xyz"}';

fixture `JSON Key verification`
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
test('Verify that user can add key with value to any level of JSON structure', async t => {
    keyName = Common.generateWord(10);
    // Add Json key with json object
    await browserPage.addJsonKey(keyName, value, keyTTL);
    // Check the notification message
    const notification = await browserPage.getMessageText();
    await t.expect(notification).contains('Key has been added', 'The notification not found');
    // Verify that user can create JSON object
    await t.expect(browserPage.addJsonObjectButton.exists).ok('The add Json object button not found', { timeout: 10000 });
    await t.expect(browserPage.jsonKeyValue.textContent).eql(jsonObjectValue, 'The json object value not found');

    // Add key with value on the same level
    await browserPage.addJsonKeyOnTheSameLevel('"key1"', '"value1"');
    // Check the added key contains json object with added key
    await t.expect(browserPage.addJsonObjectButton.exists).ok('The add Json object button not found', { timeout: 10000 });
    await t.expect(browserPage.jsonKeyValue.textContent).eql('{name:"xyz"key1:"value1"}', 'The json object value not found');
    // Add key with value inside the json
    await browserPage.addJsonKeyOnTheSameLevel('"key2"', '{}');
    await browserPage.addJsonKeyInsideStructure('"key2222"', '12345');
    // Check the added key contains json object with added key
    await t.click(browserPage.expandJsonObject);
    await t.expect(browserPage.jsonKeyValue.textContent).eql('{name:"xyz"key1:"value1"key2:{key2222:12345}}', 'The json object value not found');
});
