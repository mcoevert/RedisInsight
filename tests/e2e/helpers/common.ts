import { ClientFunction, RequestMock, t } from 'testcafe';
import { Chance } from 'chance';
import { apiUrl, commonUrl } from './conf';

const chance = new Chance();

const settingsApiUrl = `${commonUrl}/api/settings`;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // lgtm[js/disabling-certificate-validation]
const mockedSettingsResponse = {
    agreements: {
        version: '0',
        eula: false,
        analytics: false
    }
};

export class Common {
    static mockSettingsResponse(): RequestMock {
        return RequestMock()
            .onRequestTo(settingsApiUrl)
            .respond(mockedSettingsResponse, 200);
    }

    static async waitForElementNotVisible(elm: Selector): Promise<void> {
        await t.expect(elm.exists).notOk({ timeout: 10000 });
    }

    /**
     * Create array of keys
     * @param length The amount of array elements
     */
    static createArrayWithKeys(length: number): string[] {
        return Array.from({ length }, (_, i) => `key${i}`);
    }

    /**
    * Create array of keys and values
    * @param length The amount of array elements
    */
    static async createArrayWithKeyValue(length: number): Promise<string[]> {
        const arr: string[] = [];
        for (let i = 1; i <= length * 2; i++) {
            arr[i] = `${chance.word({ length: 10 })}-key${i}`;
            arr[i + 1] = `${chance.word({ length: 10 })}-value${i}`;
            i++;
        }
        return arr;
    }

    /**
    * Create array of keys and values
    * @param length The amount of array elements
    */
    static async createArrayWithKeyValueAndDelimiter(length: number): Promise<string[]> {
        const keyNameArray: string[] = [];
        for (let i = 1; i <= length; i++) {
            const key = `"key${i}:test${i}"`;
            const value = `"value${this.generateSentence(i * 2)}"`;
            keyNameArray.push(key, value);
        }
        return keyNameArray;
    }

    /**
    * Create array of keys and values
    * @param length The amount of array elements
    */
    static async createArrayWithKeyAndDelimiter(length: number): Promise<string[]> {
        const keyNameArray: string[] = [];
        for (let i = 1; i <= length; i++) {
            const key = `"key${i}:test${i}"`;
            keyNameArray.push(key);
        }
        return keyNameArray;
    }

    /**
    * Create array of keys and values for using in OSS Cluster
    * @param length The amount of array elements
    */
    static async createArrayWithKeyValueForOSSCluster(length: number): Promise<string[]> {
        const arr: string[] = [];
        for (let i = 1; i <= length * 2; i++) {
            arr[i] = `{user1}:${chance.word({ length: 10 })}-key${i}`;
            arr[i + 1] = `${chance.word({ length: 10 })}-value${i}`;
            i++;
        }
        return arr;
    }

    /**
    * Create array of keys and values with edittable counter value
    * @param length The amount of array elements
    * @param keyName The name of the key
    */
    static async createArrayWithKeyValueAndKeyname(length: number, keyName: string): Promise<string[]> {
        const keyNameArray: string[] = [];
        for (let i = 1; i <= length; i++) {
            const key = `${keyName}${i}`;
            const value = `value${i}`;
            keyNameArray.push(key, value);
        }
        return keyNameArray;
    }

    /**
     * Create array of pairs [key, value]
     * @param length The amount of array elements
     */
    static createArrayPairsWithKeyValue(length: number): [string, number][] {
        return Array.from({ length }, (_, i) => [`key${i}`, i]);
    }

    /**
    * Create array of numbers
    * @param length The amount of array elements
    */
    static async createArray(length: number): Promise<string[]> {
        const arr: string[] = [];
        for (let i = 1; i <= length; i++) {
            arr[i] = `${i}`;
        }
        return arr;
    }

    /**
    * Get background colour of element
    * @param element The selector of the element
    */
    static async getBackgroundColour(element: Selector): Promise<string> {
        return element.getStyleProperty('background-color');
    }

    /**
    * Generate word by number of symbols
    * @param number The number of symbols
    */
    static generateWord(number: number): string {
        return chance.word({ length: number });
    }

    /**
    * Generate sentence by number of words
    * @param number The number of words
    */
    static generateSentence(number: number): string {
        return chance.sentence({ words: number });
    }

    /**
    * Return api endpoint with disabled certificate validation
    */
    static getEndpoint(): string {
        return apiUrl;
    }

    /**
     * Check opened URL
     * @param expectedUrl Expected link that is compared with actual
     */
    static async checkURL(expectedUrl: string): Promise<void> {
        const getPageUrl = ClientFunction(() => window.location.href);
        await t.expect(getPageUrl()).eql(expectedUrl, 'Opened URL is not correct');
    }

    /**
     * Check opened URL contains text
     * @param expectedText Expected link that is compared with actual
     */
    static async checkURLContainsText(expectedText: string): Promise<void> {
        const getPageUrl = ClientFunction(() => window.location.href);
        await t.expect(getPageUrl()).contains(expectedText, `Opened URL not contains text ${expectedText}`);
    }

    /**
     * Replace spaces and line breaks
     * @param text text to be replaced
     */
    static async removeEmptySpacesAndBreak(text: string): Promise<string> {
        return text
            .replace(/ /g, '')
            .replace(/\n/g, '');
    }

    /**
     * Get current page url
     */
    static async getPageUrl(): Promise<string> {
        return (await ClientFunction(() => window.location.href))();
    }
}
