import { MyRedisDatabasePage, MemoryEfficiencyPage, BrowserPage, WorkbenchPage } from '../../../pageObjects';
import { RecommendationIds, rte } from '../../../helpers/constants';
import { acceptLicenseTermsAndAddDatabaseApi, deleteCustomDatabase } from '../../../helpers/database';
import { commonUrl, ossStandaloneBigConfig, ossStandaloneConfig, ossStandaloneV5Config } from '../../../helpers/conf';
import { deleteStandaloneDatabaseApi } from '../../../helpers/api/api-database';
import { RecommendationsActions } from '../../../common-actions/recommendations-actions';
import { Common } from '../../../helpers/common';

const memoryEfficiencyPage = new MemoryEfficiencyPage();
const myRedisDatabasePage = new MyRedisDatabasePage();
const browserPage = new BrowserPage();
const recommendationsActions = new RecommendationsActions();
const workbenchPage = new WorkbenchPage();

const externalPageLink = 'https://docs.redis.com/latest/ri/memory-optimizations/';
let keyName = `recomKey-${Common.generateWord(10)}`;
const stringKeyName = `smallStringKey-${Common.generateWord(5)}`;
const index = '1';
const luaScriptRecom = RecommendationIds.luaScript;
const useSmallerKeysRecom = RecommendationIds.useSmallerKeys;
const avoidLogicalDbRecom = RecommendationIds.avoidLogicalDatabases;
const redisVersionRecom = RecommendationIds.redisVersion;
const redisTimeSeriesRecom = RecommendationIds.optimizeTimeSeries;

fixture `Memory Efficiency Recommendations`
    .meta({ type: 'critical_path', rte: rte.standalone })
    .page(commonUrl)
    .beforeEach(async t => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
        // Go to Analysis Tools page
        await t.click(myRedisDatabasePage.NavigationPanel.analysisPageButton);
    })
    .afterEach(async t => {
        // Clear and delete database
        await t.click(myRedisDatabasePage.NavigationPanel.browserButton);
        await browserPage.deleteKeyByName(keyName);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    });
test
    .before(async t => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneBigConfig, ossStandaloneBigConfig.databaseName);
        // Go to Analysis Tools page
        await t.click(myRedisDatabasePage.NavigationPanel.analysisPageButton);
        // Add cached scripts and generate new report
        await memoryEfficiencyPage.Cli.addCachedScripts(11);
        await t.click(memoryEfficiencyPage.newReportBtn);
        // Go to Recommendations tab
        await t.click(memoryEfficiencyPage.recommendationsTab);
    })
    .after(async() => {
        await browserPage.Cli.sendCommandInCli('SCRIPT FLUSH');
        await deleteStandaloneDatabaseApi(ossStandaloneBigConfig);
    })('Recommendations displaying', async t => {
        await t.click(memoryEfficiencyPage.newReportBtn);
        // Verify that user can see Avoid dynamic Lua script recommendation when number_of_cached_scripts> 10
        await t.expect(await memoryEfficiencyPage.getRecommendationByName(luaScriptRecom).exists)
            .ok('Avoid dynamic lua script recommendation not displayed');
        // Verify that user can see type of recommendation badge
        await t.expect(memoryEfficiencyPage.getRecommendationLabelByName(luaScriptRecom, 'code').exists)
            .ok('Avoid dynamic lua script recommendation not have Code Changes label');
        await t.expect(memoryEfficiencyPage.getRecommendationLabelByName(luaScriptRecom, 'configuration').exists)
            .notOk('Avoid dynamic lua script recommendation have Configuration Changes label');

        // Verify that user can see Use smaller keys recommendation when database has 1M+ keys
        await t.expect(await memoryEfficiencyPage.getRecommendationByName(useSmallerKeysRecom).exists).ok('Use smaller keys recommendation not displayed');

        // Verify that user can see all the recommendations expanded by default
        await t.expect(memoryEfficiencyPage.getRecommendationButtonByName(luaScriptRecom).getAttribute('aria-expanded'))
            .eql('true', 'Avoid dynamic lua script recommendation not expanded');
        await t.expect(memoryEfficiencyPage.getRecommendationButtonByName(useSmallerKeysRecom).getAttribute('aria-expanded'))
            .eql('true', 'Use smaller keys recommendation not expanded');

        // Verify that user can expand/collapse recommendation
        const expandedTextContaiterSize = await memoryEfficiencyPage.getRecommendationByName(luaScriptRecom).offsetHeight;
        await t.click(memoryEfficiencyPage.getRecommendationButtonByName(luaScriptRecom));
        await t.expect(await memoryEfficiencyPage.getRecommendationByName(luaScriptRecom).offsetHeight)
            .lt(expandedTextContaiterSize, 'Lua script recommendation not collapsed');
        await t.click(memoryEfficiencyPage.getRecommendationButtonByName(luaScriptRecom));
        await t.expect(await memoryEfficiencyPage.getRecommendationByName(luaScriptRecom).offsetHeight)
            .eql(expandedTextContaiterSize, 'Lua script recommendation not expanded');

        // Verify that user can navigate by link to see the recommendation
        await t.click(memoryEfficiencyPage.getRecommendationByName(luaScriptRecom).find(memoryEfficiencyPage.cssReadMoreLink));
        await Common.checkURL(externalPageLink);
        // Close the window with external link to switch to the application window
        await t.closeWindow();
    });
// skipped due to inability to receive no recommendations for now
test.skip('No recommendations message', async t => {
    keyName = `recomKey-${Common.generateWord(10)}`;
    const noRecommendationsMessage = 'No recommendations at the moment, run a new report later to keep up the good work!';
    const command = `HSET ${keyName} field value`;

    // Create Hash key and create report
    await browserPage.Cli.sendCommandInCli(command);
    await t.click(memoryEfficiencyPage.newReportBtn);
    // Go to Recommendations tab
    await t.click(memoryEfficiencyPage.recommendationsTab);
    // No recommendations message
    await t.expect(memoryEfficiencyPage.noRecommendationsMessage.textContent).eql(noRecommendationsMessage, 'No recommendations message not displayed');
});
test
    .before(async t => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
        keyName = `recomKey-${Common.generateWord(10)}`;
        await browserPage.addStringKey(stringKeyName, '2147476121', 'field');
        await t.click(myRedisDatabasePage.NavigationPanel.myRedisDBButton);
        await myRedisDatabasePage.AddRedisDatabase.addLogicalRedisDatabase(ossStandaloneConfig, index);
        await myRedisDatabasePage.clickOnDBByName(`${ossStandaloneConfig.databaseName} [db${index}]`);
        await browserPage.addHashKey(keyName, '2147476121', 'field', 'value');
    })
    .after(async t => {
        // Clear and delete database
        await t.click(myRedisDatabasePage.NavigationPanel.browserButton);
        await browserPage.deleteKeyByName(keyName);
        await deleteCustomDatabase(`${ossStandaloneConfig.databaseName} [${index}]`);
        await myRedisDatabasePage.clickOnDBByName(ossStandaloneConfig.databaseName);
        await browserPage.deleteKeyByName(stringKeyName);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    })('Avoid using logical databases recommendation', async t => {
        // Go to Analysis Tools page
        await t.click(myRedisDatabasePage.NavigationPanel.analysisPageButton);
        await t.click(memoryEfficiencyPage.newReportBtn);
        // Go to Recommendations tab
        await t.click(memoryEfficiencyPage.recommendationsTab);
        // Verify that user can see Avoid using logical databases recommendation when the database supports logical databases and there are keys in more than 1 logical database
        await t.expect(await memoryEfficiencyPage.getRecommendationByName(avoidLogicalDbRecom).exists)
            .ok('Avoid using logical databases recommendation not displayed');
        await t.expect(memoryEfficiencyPage.getRecommendationLabelByName(avoidLogicalDbRecom, 'code').exists)
            .ok('Avoid using logical databases recommendation not have Code Changes label');
    });
test
    .before(async t => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneV5Config, ossStandaloneV5Config.databaseName);
        // Go to Analysis Tools page and create new report and open recommendations
        await t.click(myRedisDatabasePage.NavigationPanel.analysisPageButton);
        await t.click(memoryEfficiencyPage.newReportBtn);
        await t.click(memoryEfficiencyPage.recommendationsTab);
    }).after(async() => {
        await deleteStandaloneDatabaseApi(ossStandaloneV5Config);
    })('Verify that user can upvote recommendations', async t => {
        await recommendationsActions.voteForRecommendation(redisVersionRecom, 'not-useful');
        // Verify that user can rate recommendations with one of 3 existing types at the same time
        await recommendationsActions.verifyVoteDisabled(redisVersionRecom, 'not-useful');

        // Verify that user can see the popup with link when he votes for “Not useful”
        await t.expect(memoryEfficiencyPage.recommendationsFeedbackBtn.visible).ok('popup did not appear after voting for not useful');

        // Verify that user can see previous votes when reload the page
        await memoryEfficiencyPage.reloadPage();
        await t.click(memoryEfficiencyPage.recommendationsTab);
        await recommendationsActions.verifyVoteDisabled(redisVersionRecom, 'not-useful');

        await t.click(memoryEfficiencyPage.newReportBtn);
        await recommendationsActions.voteForRecommendation(redisVersionRecom, 'useful');
        await recommendationsActions.verifyVoteDisabled(redisVersionRecom, 'useful');
    });
test
    .before(async t => {
        await acceptLicenseTermsAndAddDatabaseApi(ossStandaloneConfig, ossStandaloneConfig.databaseName);
        keyName = `recomKey-${Common.generateWord(10)}`;
        await browserPage.addZSetKey(keyName, '151153320500121', '2147476121', '1511533205001:21');
        // Go to Analysis Tools page
        await t.click(myRedisDatabasePage.NavigationPanel.analysisPageButton);
        await t.click(memoryEfficiencyPage.newReportBtn);
        // Go to Recommendations tab
        await t.click(memoryEfficiencyPage.recommendationsTab);
    })
    .after(async t => {
    // Clear and delete database
        await t.click(myRedisDatabasePage.NavigationPanel.browserButton);
        await browserPage.deleteKeyByName(keyName);
        await deleteStandaloneDatabaseApi(ossStandaloneConfig);
    })('Verify that user can see the Tutorial opened when clicking on "Tutorial" for recommendations', async t => {
        // Verify that Optimize the use of time series recommendation displayed
        await t.expect(await memoryEfficiencyPage.getRecommendationByName(redisTimeSeriesRecom).exists).ok('Optimize the use of time series recommendation not displayed');
        // Verify that tutorial opened
        await t.click(memoryEfficiencyPage.getToTutorialBtnByRecomName(redisTimeSeriesRecom));
        await t.expect(workbenchPage.preselectArea.visible).ok('Workbench Enablement area not opened');
        // Verify that REDIS FOR TIME SERIES tutorial expanded
        await t.expect((await workbenchPage.getTutorialByName('REDIS FOR TIME SERIES')).visible).ok('REDIS FOR TIME SERIES tutorial is not expanded');
    });
