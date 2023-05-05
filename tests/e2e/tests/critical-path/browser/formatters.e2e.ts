import { Selector } from 'testcafe';
import { keyLength, rte } from '../../../helpers/constants';
import { addKeysViaCli, deleteKeysViaCli, keyTypes } from '../../../helpers/keys';
import { acceptLicenseTermsAndAddDatabaseApi } from '../../../helpers/database';
import { BrowserPage } from '../../../pageObjects';
import { commonUrl, ossStandaloneConfig } from '../../../helpers/conf';
import { deleteStandaloneDatabaseApi } from '../../../helpers/api/api-database';
import { Common } from '../../../helpers/common';
import { formatters, phpData } from '../../../test-data/formatters-data';

const browserPage = new BrowserPage();

const keysData = keyTypes.map(object => ({ ...object })).filter((v, i) => i <= 6 && i !== 5);
keysData.forEach(key => key.keyName = `${key.keyName}` + '-' + `${Common.generateWord(keyLength)}`);
const binaryFormattersSet = [formatters[5], formatters[6], formatters[7]];
const formattersHighlightedSet = [formatters[0], formatters[3]];
const fromBinaryFormattersSet = [formatters[1], formatters[2], formatters[4], formatters[8]];
const formattersForEditSet = [formatters[0], formatters[1], formatters[3]];
const formattersWithTooltipSet = [formatters[0], formatters[1], formatters[2], formatters[3], formatters[4], formatters[8]];
const notEditableFormattersSet = [formatters[2], formatters[4], formatters[8]];
const defaultFormatter = 'Unicode';

fixture `Formatters`
    .meta({
        type: 'critical_path',
        rte: rte.standalone
    })
    .page(commonUrl)
    .beforeEach(async() => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
        // Create new keys
        await addKeysViaCli(keysData);
    })
    .afterEach(async() => {
        // Clear keys and database
        await deleteKeysViaCli(keysData);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    });
formattersHighlightedSet.forEach(formatter => {
    test
        .before(async() => {
            await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
            // Create new keys
            await addKeysViaCli(keysData, formatter.fromText, formatter.fromText);
        })(`Verify that user can see highlighted key details in ${formatter.format} format`, async t => {
            // Verify for JSON and PHP serialized
            // Verify for Hash, List, Set, ZSet, String, Stream keys
            for (const key of keysData) {
                const valueSelector = Selector(`[data-testid^=${key.keyName.split('-')[0]}-][data-testid*=${key.data}]`);
                await browserPage.openKeyDetailsByKeyName(key.keyName);
                // Verify that value not formatted with default formatter
                await browserPage.selectFormatter(defaultFormatter);
                await t.expect(valueSelector.find(browserPage.cssJsonValue).exists).notOk(`${key.textType} Value is formatted to ${formatter.format}`);
                await browserPage.selectFormatter(formatter.format);
                // Verify that value is formatted and highlighted
                await t.expect(valueSelector.find(browserPage.cssJsonValue).exists).ok(`${key.textType} Value is not formatted to ${formatter.format}`);
                // Verify that Hash field is formatted and highlighted for JSON and PHP serialized
                if (key.keyName === 'hash') {
                    await t.expect(browserPage.hashField.find(browserPage.cssJsonValue).exists).ok(`Hash field is not formatted to ${formatter.format}`);
                }
                // Verify that Stream field is formatted and highlighted for JSON and PHP serialized
                if (key.keyName === 'stream') {
                    await t.expect(Selector(browserPage.cssJsonValue).count).eql(2, `Hash field is not formatted to ${formatter.format}`);
                }
            }
        });
});
fromBinaryFormattersSet.forEach(formatter => {
    test(`Verify that user can see highlighted key details in ${formatter.format} format`, async t => {
        // Verify for Msgpack, Protobuf, Java serialized, Pickle formats
        // Open Hash key details
        await browserPage.openKeyDetailsByKeyName(keysData[0].keyName);
        // Add valid value in HEX format for convertion
        await browserPage.selectFormatter('HEX');
        await browserPage.editHashKeyValue(formatter.fromHexText ?? '');
        await browserPage.selectFormatter(formatter.format);
        // Verify that value is formatted and highlighted
        await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.formattedText ?? '', `Value is not saved as ${formatter.format}`);
        await t.expect(browserPage.hashFieldValue.find(browserPage.cssJsonValue).exists).ok(`Value is not formatted to ${formatter.format}`);

    });
});
formattersForEditSet.forEach(formatter => {
    test(`Verify that user can edit the values in the key regardless if they are valid in ${formatter.format} format or not`, async t => {
        // Verify for JSON, Msgpack, PHP serialized formatters
        const invalidText = 'invalid text';
        // Open key details and select formatter
        await browserPage.openKeyDetails(keysData[0].keyName);
        await browserPage.selectFormatter(formatter.format);
        await browserPage.editHashKeyValue(invalidText);
        await t.click(browserPage.saveButton);
        // Verify that invalid value can be saved
        await t.expect(browserPage.hashFieldValue.textContent).contains(invalidText, `Invalid ${formatter.format} value is not saved`);
        // Add valid value which can be converted
        await browserPage.editHashKeyValue(formatter.fromText ?? '');
        // Verify that valid value can be saved on edit
        formatter.format === 'PHP serialized'
            ? await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.formattedText ?? '', `Valid ${formatter.format} value is not saved`)
            : await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.fromText ?? '', `Valid ${formatter.format} value is not saved`);
        await t.expect(browserPage.hashFieldValue.find(browserPage.cssJsonValue).exists).ok(`Value is not formatted to ${formatter.format}`);
        await browserPage.editHashKeyValue(formatter.fromTextEdit ?? '');
        // Verify that valid value can be edited to another valid value
        await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.fromTextEdit ?? '', `Valid ${formatter.format} value is not saved`);
        await t.expect(browserPage.hashFieldValue.find(browserPage.cssJsonValue).exists).ok(`Value is not formatted to ${formatter.format}`);
    });
});
formattersWithTooltipSet.forEach(formatter => {
    test(`Verify that user can see tooltip with convertion failed message on hover when data is not valid ${formatter.format}`, async t => {
        // Verify for JSON, Msgpack, Protobuf, PHP serialized, Java serialized object, Pickle formatters
        const failedMessage = `Failed to convert to ${formatter.format}`;
        for (let i = 0; i < keysData.length; i++) {
            const valueSelector = Selector(`[data-testid^=${keysData[i].keyName.split('-')[0]}-][data-testid*=${keysData[i].data}]`);
            // Open key details and select formatter
            await browserPage.openKeyDetailsByKeyName(keysData[i].keyName);
            await browserPage.selectFormatter(formatter.format);
            // Verify that not valid value is not formatted
            await t.expect(valueSelector.find(browserPage.cssJsonValue).exists).notOk(`${keysData[i].textType} Value is formatted to ${formatter.format}`);
            await t.hover(valueSelector, { offsetX: 5 });
            // Verify that tooltip with convertion failed message displayed
            await t.expect(browserPage.tooltip.textContent).contains(failedMessage, `"${failedMessage}" is not displayed in tooltip`);
        }
    });
});
binaryFormattersSet.forEach(formatter => {
    test
        .before(async() => {
            await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
            // Create new keys
            await addKeysViaCli(keysData, formatter.fromText);
        })(`Verify that user can see key details converted to ${formatter.format} format`, async t => {
            // Verify for ASCII, HEX, Binary formatters
            // Verify for Hash, List, Set, ZSet, String, Stream keys
            for (let i = 0; i < keysData.length; i++) {
                const valueSelector = Selector(`[data-testid^=${keysData[i].keyName.split('-')[0]}-][data-testid*=${keysData[i].data}]`);
                await browserPage.openKeyDetailsByKeyName(keysData[i].keyName);
                // Verify that value not formatted with default formatter
                await browserPage.selectFormatter(defaultFormatter);
                await t.expect(valueSelector.innerText).contains(formatter.fromText ?? '', `Value is formatted as ${formatter.format} in Unicode`);
                await browserPage.selectFormatter(formatter.format);
                // Verify that value is formatted
                await t.expect(valueSelector.innerText).contains(formatter.formattedText ?? '', `Value is not formatted to ${formatter.format}`);
                // Verify that Hash field is formatted to ASCII/HEX/Binary
                if (keysData[i].keyName === 'hash') {
                    await t.expect(browserPage.hashField.innerText).contains(formatter.formattedText ?? '', `Hash field is not formatted to ${formatter.format}`);
                }
            }
        });
    test(`Verify that user can edit value for Hash field in ${formatter.format} and convert then to another format`, async t => {
        // Verify for ASCII, HEX, Binary formatters
        // Open key details and select formatter
        await browserPage.openKeyDetails(keysData[0].keyName);
        await browserPage.selectFormatter(formatter.format);
        // Add value in selected format
        await browserPage.editHashKeyValue(formatter.formattedText ?? '');
        // Verify that value saved in selected format
        await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.formattedText ?? '', `${formatter.format} value is not saved`);
        await browserPage.selectFormatter('Unicode');
        // Verify that value converted to Unicode
        await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.fromText ?? '', `${formatter.format} value is not converted to Unicode`);
        await browserPage.selectFormatter(formatter.format);
        await browserPage.editHashKeyValue(formatter.formattedTextEdit ?? '');
        // Verify that valid converted value can be edited to another
        await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.formattedTextEdit ?? '', `${formatter.format} value is not saved`);
        await browserPage.selectFormatter('Unicode');
        // Verify that value converted to Unicode
        await t.expect(browserPage.hashFieldValue.innerText).contains(formatter.fromTextEdit ?? '', `${formatter.format} value is not converted to Unicode`);
    });
});
test('Verify that user can format different data types of PHP serialized', async t => {
    // Open Hash key details
    await browserPage.openKeyDetailsByKeyName(keysData[0].keyName);
    for (const type of phpData) {
        //Add fields to the hash key
        await browserPage.selectFormatter('Unicode');
        await browserPage.addFieldToHash(type.dataType, type.from);
        //Search the added field
        await browserPage.searchByTheValueInKeyDetails(type.dataType);
        await browserPage.selectFormatter('PHP serialized');
        // Verify that PHP serialized value is formatted and highlighted
        await t.expect(browserPage.hashFieldValue.innerText).contains(type.converted, `Value is not saved as PHP ${type.dataType}`);
        await t.expect(browserPage.hashFieldValue.find(browserPage.cssJsonValue).exists).ok(`Value is not formatted to PHP ${type.dataType}`);
    }
});
notEditableFormattersSet.forEach(formatter => {
    test(`Verify that user see edit icon disabled for all keys when ${formatter.format} selected`, async t => {
        // Verify for Protobuf, Java serialized, Pickle
        // Verify for Hash, List, ZSet, String keys
        for (const key of keysData) {
            if (key.keyName === 'hash' || key.keyName === 'list' || key.keyName === 'zset' || key.keyName === 'string') {
                const editBtn = (key.keyName === 'string')
                    ? browserPage.editKeyValueButton
                    : Selector(`[data-testid^=edit-][data-testid*=${key.keyName.split('-')[0]}]`);
                await browserPage.openKeyDetailsByKeyName(key.keyName);
                await browserPage.selectFormatter(formatter.format);
                // Verify that edit button disabled
                await t.expect(editBtn.hasAttribute('disabled')).ok(`Key ${key.textType} is enabled for ${formatter.format} formatter`);
                // Hover on disabled button
                await t.hover(editBtn);
                // Verify tooltip content
                await t.expect(browserPage.tooltip.textContent).contains('Cannot edit the value in this format', 'Tooltip has wrong text');
            }
        }
    });
});
