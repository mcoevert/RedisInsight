import { acceptLicenseTermsAndAddDatabaseApi } from '../../../helpers/database';
import { BrowserPage } from '../../../pageObjects';
import {
    commonUrl,
    ossStandaloneBigConfig,
    ossStandaloneConfig
} from '../../../helpers/conf';
import { keyLength, KeyTypesTexts, rte } from '../../../helpers/constants';
import { addKeysViaCli, deleteKeysViaCli, keyTypes } from '../../../helpers/keys';
import { deleteStandaloneDatabaseApi } from '../../../helpers/api/api-database';
import { Common } from '../../../helpers/common';

const browserPage = new BrowserPage();

let keyName = Common.generateWord(10);
const keysData = keyTypes.map(object => ({ ...object }));
keysData.forEach(key => key.keyName = `${key.keyName}` + '-' + `${Common.generateWord(keyLength)}`);

fixture `Filtering per key name in Browser page`
    .meta({ type: 'critical_path', rte: rte.standalone })
    .page(commonUrl)
    .beforeEach(async() => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
    })
    .afterEach(async() => {
        // Delete database
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    });
test
    .after(async() => {
        // Clear and delete database
        await browserPage.deleteKeyByName(keyName);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    })('Verify that user can search a key with selected data type is filters', async t => {
        keyName = Common.generateWord(10);
        // Add new key
        await browserPage.addStringKey(keyName);
        // Search by key with full name & specified type
        await browserPage.selectFilterGroupType(KeyTypesTexts.String);
        await browserPage.searchByKeyName(keyName);
        // Verify that key was found
        const isKeyIsDisplayedInTheList = await browserPage.isKeyIsDisplayedInTheList(keyName);
        await t.expect(isKeyIsDisplayedInTheList).ok('The key was found');
        // Verify that user can see filtering per key name starts when he press Enter or clicks the control to filter per key name
        // Clear filter
        await t.click(browserPage.clearFilterButton);
        // Check the filtering starts by press Enter
        await t.typeText(browserPage.filterByPatterSearchInput, 'InvalidText', { replace: true, paste: true });
        await t.pressKey('enter');
        await t.expect(browserPage.searchAdvices.exists).ok('The filtering is set');
        // Check the filtering starts by clicks the control
        await browserPage.reloadPage();
        await t.typeText(browserPage.filterByPatterSearchInput, 'InvalidText', { replace: true, paste: true });
        await t.click(browserPage.searchButton);
        await t.expect(browserPage.searchAdvices.exists).ok('The filtering is set');
    });
test
    .after(async() => {
        // Clear keys and database
        await deleteKeysViaCli(keysData);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    })('Verify that user can filter keys per data type in Browser page', async t => {
        keyName = Common.generateWord(10);
        // Create new keys
        await addKeysViaCli(keysData);
        for (const { textType, keyName } of keysData) {
            await browserPage.selectFilterGroupType(textType);
            await t.expect(await browserPage.isKeyIsDisplayedInTheList(keyName)).ok(`The key of type ${textType} was found`);
            const regExp = new RegExp('[1-9]');
            await t.expect(browserPage.keysNumberOfResults.textContent).match(regExp, 'Number of found keys');
        }
    });
test
    .before(async() => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneBigConfig, ossStandaloneBigConfig.databaseName);
    })
    .after(async() => {
        // Delete database
        await deleteStandaloneDatabaseApi(ossStandaloneBigConfig);
    })('Verify that user see the key type label when filtering per key types and when removes label the filter is removed on Browser page', async t => { //Check filtering labels
        for (const { textType } of keyTypes) {
            await browserPage.selectFilterGroupType(textType);
            // Check key type label
            await t.expect((await browserPage.filteringLabel.textContent).toUpperCase).eql(textType.toUpperCase, `The label of type ${textType} is displayed`);
            if (['Stream', 'Graph', 'TS'].includes(textType)) {
                await t.expect(browserPage.keysNumberOfResults.textContent).eql('0', 'Number of found keys');
            }
            else {
                const regExp = new RegExp('5..');
                await t.expect(browserPage.keysNumberOfResults.textContent).match(regExp, 'Number of found keys');
            }
        }
        // Check removing of the label
        await t.click(browserPage.deleteFilterButton);
        await t.expect(browserPage.multiSearchArea.find(browserPage.cssFilteringLabel).exists).notOk('The label of filtering type is removed');
        await t.expect(browserPage.keysSummary.textContent).contains('Total', 'The filter is removed');
    });
