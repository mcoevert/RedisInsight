import React from 'react'
import { fireEvent } from '@testing-library/react'
import { cloneDeep } from 'lodash'
import reactRouterDom from 'react-router-dom'
import { cleanup, clearStoreActions, mockedStore, render, screen } from 'uiSrc/utils/test-utils'

import { OnboardingTour } from 'uiSrc/components'
import { appFeatureOnboardingSelector, setOnboardNextStep, setOnboardPrevStep } from 'uiSrc/slices/app/features'
import { keysDataSelector } from 'uiSrc/slices/browser/keys'
import { sendEventTelemetry, TelemetryEvent } from 'uiSrc/telemetry'
import { OnboardingStepName, OnboardingSteps } from 'uiSrc/constants/onboarding'
import { openCli, openCliHelper, resetCliHelperSettings, resetCliSettings } from 'uiSrc/slices/cli/cli-settings'
import { setMonitorInitialState, showMonitor } from 'uiSrc/slices/cli/monitor'
import { Pages } from 'uiSrc/constants'
import { setWorkbenchEAMinimized } from 'uiSrc/slices/app/context'
import { dbAnalysisSelector, setDatabaseAnalysisViewTab } from 'uiSrc/slices/analytics/dbAnalysis'
import { DatabaseAnalysisViewTab } from 'uiSrc/slices/interfaces/analytics'
import { fetchRedisearchListAction, loadList } from 'uiSrc/slices/browser/redisearch'
import { stringToBuffer } from 'uiSrc/utils'
import { RedisResponseBuffer } from 'uiSrc/slices/interfaces'
import { ONBOARDING_FEATURES } from './OnboardingFeatures'

jest.mock('uiSrc/slices/app/features', () => ({
  ...jest.requireActual('uiSrc/slices/app/features'),
  appFeatureOnboardingSelector: jest.fn().mockReturnValue({
    currentStep: 0,
    isActive: true,
    totalSteps: 14
  })
}))

jest.mock('uiSrc/slices/browser/keys', () => ({
  ...jest.requireActual('uiSrc/slices/browser/keys'),
  keysDataSelector: jest.fn().mockReturnValue({
    total: 0
  })
}))

jest.mock('uiSrc/slices/browser/redisearch', () => ({
  ...jest.requireActual('uiSrc/slices/browser/redisearch'),
  fetchRedisearchListAction: jest.fn()
    .mockImplementation(jest.requireActual('uiSrc/slices/browser/redisearch').fetchRedisearchListAction)
}))

jest.mock('uiSrc/slices/analytics/dbAnalysis', () => ({
  ...jest.requireActual('uiSrc/slices/analytics/dbAnalysis'),
  dbAnalysisSelector: jest.fn().mockReturnValue({
    data: {
      recommendations: []
    }
  })
}))

jest.mock('uiSrc/telemetry', () => ({
  ...jest.requireActual('uiSrc/telemetry'),
  sendEventTelemetry: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn,
  }),
}))

const getEventProperties = (action: string, step: OnboardingStepName) => ({
  event: TelemetryEvent.ONBOARDING_TOUR_CLICKED,
  eventData: {
    action,
    databaseId: '',
    step
  }
})

const checkAllTelemetryButtons = (stepName: OnboardingStepName, sendEventTelemetry: jest.Mock) => {
  fireEvent.click(screen.getByTestId('next-btn'))
  expect(sendEventTelemetry).toBeCalledWith(getEventProperties('next', stepName))
  sendEventTelemetry.mockRestore()

  fireEvent.click(screen.getByTestId('back-btn'))
  expect(sendEventTelemetry).toBeCalledWith(getEventProperties('back', stepName))
  sendEventTelemetry.mockRestore()

  fireEvent.click(screen.getByTestId('skip-tour-btn'))
  expect(sendEventTelemetry).toBeCalledWith(getEventProperties('closed', stepName))
  sendEventTelemetry.mockRestore()
}

let store: typeof mockedStore
beforeEach(() => {
  cleanup()
  store = cloneDeep(mockedStore)
  store.clearActions()
})

describe('ONBOARDING_FEATURES', () => {
  describe('BROWSER_PAGE', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.BrowserPage,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PAGE}><span /></OnboardingTour>)
      ).toBeTruthy()
    })

    it('should render proper text without keys', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PAGE}><span /></OnboardingTour>)
      expect(screen.getByTestId('step-content')).toHaveTextContent('Add a key to your database using a dedicated form.')
    })

    it('should render proper text with keys', () => {
      (keysDataSelector as jest.Mock).mockReturnValueOnce({
        total: 10
      })

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PAGE}><span /></OnboardingTour>)
      expect(screen.getByTestId('step-content')).not.toHaveTextContent('Add a key to your database using a dedicated form.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PAGE}><span /></OnboardingTour>)

      fireEvent.click(screen.getByTestId('next-btn'))
      expect(sendEventTelemetry).toBeCalledWith(getEventProperties('next', OnboardingStepName.BrowserWithoutKeys));
      (sendEventTelemetry as jest.Mock).mockRestore()

      fireEvent.click(screen.getByTestId('skip-tour-btn'))
      expect(sendEventTelemetry).toBeCalledWith(getEventProperties('closed', OnboardingStepName.BrowserWithoutKeys));
      (sendEventTelemetry as jest.Mock).mockRestore()
    })
  })

  describe('BROWSER_TREE_VIEW', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.BrowserTreeView,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_TREE_VIEW}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Switch from List to Tree view to see keys grouped')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_TREE_VIEW}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.BrowserTreeView, sendEventTelemetry as jest.Mock)
    })
  })

  describe('BROWSER_FILTER_SEARCH', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.BrowserFilterSearch,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_FILTER_SEARCH}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Choose between filtering your data based on key name')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_FILTER_SEARCH}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.BrowserFilters, sendEventTelemetry as jest.Mock)
    })

    it('should call proper actions', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_FILTER_SEARCH}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))

      const expectedActions = [openCli(), setOnboardNextStep()]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })
  })

  describe('BROWSER_CLI', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.BrowserCLI,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_CLI}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Use CLI to run Redis commands.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_CLI}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.BrowserCLI, sendEventTelemetry as jest.Mock)
    })

    it('should call proper actions on next', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_CLI}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))

      const expectedActions = [openCliHelper(), setOnboardNextStep()]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })
  })

  describe('BROWSER_COMMAND_HELPER', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.BrowserCommandHelper,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_COMMAND_HELPER}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Command Helper lets you search and learn more about Redis commands')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_COMMAND_HELPER}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.BrowserCommandHelper, sendEventTelemetry as jest.Mock)
    })

    it('should call proper actions on back', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_COMMAND_HELPER}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))

      const expectedActions = [openCli(), setOnboardPrevStep()]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should call proper actions on next', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_COMMAND_HELPER}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))

      const expectedActions = [showMonitor(), setOnboardNextStep()]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })
  })

  describe('BROWSER_PROFILER', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.BrowserProfiler,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PROFILER}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Use Profiler to track commands sent against the Redis server in real-time.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PROFILER}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.BrowserProfiler, sendEventTelemetry as jest.Mock)
    })

    it('should call proper actions on back', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PROFILER}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))

      const expectedActions = [openCliHelper(), setOnboardPrevStep()]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should call proper actions on next', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PROFILER}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))

      const expectedActions = [
        resetCliSettings(),
        resetCliHelperSettings(),
        setMonitorInitialState(),
        setOnboardNextStep()
      ]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should properly push history on next', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.BROWSER_PROFILER}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.workbench(''))
    })
  })

  describe('WORKBENCH_PAGE', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.WorkbenchPage,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('This is Workbench, our advanced CLI for Redis commands.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.WorkbenchIntro, sendEventTelemetry as jest.Mock)
    })

    it('should call proper actions on mount', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)

      const expectedActions = [loadList()]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should render FT.INFO when there are indexes in database', () => {
      const fetchRedisearchListActionMock = (onSuccess?: (indexes: RedisResponseBuffer[]) => void) =>
        jest.fn().mockImplementation(() => onSuccess?.([stringToBuffer('someIndex')]));

      (fetchRedisearchListAction as jest.Mock).mockImplementation(fetchRedisearchListActionMock)
      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)

      expect(screen.getByTestId('wb-onboarding-command')).toHaveTextContent('FT.INFO someIndex')
    })

    it('should render CLIENT LIST when there are no indexes in database', () => {
      const fetchRedisearchListActionMock = (onSuccess?: (indexes: RedisResponseBuffer[]) => void) =>
        jest.fn().mockImplementation(() => onSuccess?.([]));

      (fetchRedisearchListAction as jest.Mock).mockImplementation(fetchRedisearchListActionMock)
      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)

      expect(screen.getByTestId('wb-onboarding-command')).toHaveTextContent('CLIENT LIST')
    })

    it('should call proper actions on back', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))

      const expectedActions = [showMonitor(), setOnboardPrevStep()]
      expect(clearStoreActions(store.getActions().slice(-2)))
        .toEqual(clearStoreActions(expectedActions))
    })

    it('should properly push history on back', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_PAGE}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.browser(''))
    })
  })

  describe('WORKBENCH_ENABLEMENT_GUIDE', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.WorkbenchEnablementGuide,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_ENABLEMENT_GUIDE}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Learn more about how Redis can solve your use cases using Guides and Tutorials.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_ENABLEMENT_GUIDE}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.WorkbenchGuides, sendEventTelemetry as jest.Mock)
    })

    it('should call proper actions init', () => {
      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_ENABLEMENT_GUIDE}><span /></OnboardingTour>)

      const expectedActions = [setWorkbenchEAMinimized(false)]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should properly push history on next', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.WORKBENCH_ENABLEMENT_GUIDE}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.clusterDetails(''))
    })
  })

  describe('ANALYTICS_OVERVIEW', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.AnalyticsOverview,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_OVERVIEW}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Investigate memory and key allocation in your cluster database and monitor')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_OVERVIEW}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.ClusterOverview, sendEventTelemetry as jest.Mock)
    })

    it('should properly push history on back', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_OVERVIEW}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.workbench(''))
    })

    it('should properly push history on next', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_OVERVIEW}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.databaseAnalysis(''))
    })
  })

  describe('ANALYTICS_DATABASE_ANALYSIS', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.AnalyticsDatabaseAnalysis,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_DATABASE_ANALYSIS}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Use Database Analysis to get summary of your database and receive')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_DATABASE_ANALYSIS}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.DatabaseAnalysisOverview, sendEventTelemetry as jest.Mock)
    })

    it('should properly push history on back', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_DATABASE_ANALYSIS}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.workbench(''))
    })

    it('should properly push history on next', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_DATABASE_ANALYSIS}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.slowLog(''))
    })

    it('should call proper actions on next with recommendations', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock });
      (dbAnalysisSelector as jest.Mock).mockReturnValue({
        data: {
          recommendations: [{}]
        }
      })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_DATABASE_ANALYSIS}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).not.toHaveBeenCalled()

      const expectedActions = [
        setDatabaseAnalysisViewTab(DatabaseAnalysisViewTab.Recommendations),
        setOnboardNextStep()
      ]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })
  })

  describe('ANALYTICS_RECOMMENDATIONS', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.AnalyticsRecommendations,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_RECOMMENDATIONS}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('See recommendations to optimize the memory usage, performance')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_RECOMMENDATIONS}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.DatabaseAnalysisRecommendations, sendEventTelemetry as jest.Mock)
    })

    it('should properly push history on next', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_RECOMMENDATIONS}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.slowLog(''))
    })
  })

  describe('ANALYTICS_SLOW_LOG', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.AnalyticsSlowLog,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_SLOW_LOG}><span /></OnboardingTour>)
      )
        .toBeTruthy()
      expect(screen.getByTestId('step-content'))
        .toHaveTextContent('Check Slow Log to troubleshoot performance issues.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_SLOW_LOG}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.SlowLog, sendEventTelemetry as jest.Mock)
    })

    it('should properly push history on back with recommendations', () => {
      (dbAnalysisSelector as jest.Mock).mockReturnValueOnce({
        data: {
          recommendations: [{}]
        }
      })
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_SLOW_LOG}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.databaseAnalysis(''))

      const expectedActions = [
        setDatabaseAnalysisViewTab(DatabaseAnalysisViewTab.Recommendations),
        setOnboardPrevStep()
      ]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should properly actions on back', () => {
      (dbAnalysisSelector as jest.Mock).mockReturnValueOnce({
        data: {
          recommendations: []
        }
      })
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_SLOW_LOG}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.databaseAnalysis(''))

      const expectedActions = [
        setOnboardPrevStep(),
        setOnboardPrevStep()
      ]
      expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
    })

    it('should call proper history push on next ', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.ANALYTICS_SLOW_LOG}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.pubSub(''))
    })
  })

  describe('PUB_SUB_PAGE', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.PubSubPage,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.PUB_SUB_PAGE}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Use Redis pub/sub to subscribe to channels and post messages to channels.')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.PUB_SUB_PAGE}><span /></OnboardingTour>)
      checkAllTelemetryButtons(OnboardingStepName.PubSub, sendEventTelemetry as jest.Mock)
    })

    it('should properly push history on back', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.PUB_SUB_PAGE}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('back-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.slowLog(''))
    })
  })

  describe('FINISH', () => {
    beforeEach(() => {
      (appFeatureOnboardingSelector as jest.Mock).mockReturnValue({
        currentStep: OnboardingSteps.Finish,
        isActive: true,
        totalSteps: Object.keys(ONBOARDING_FEATURES).length
      })
    })

    it('should render', () => {
      expect(
        render(<OnboardingTour options={ONBOARDING_FEATURES.FINISH}><span /></OnboardingTour>)
      ).toBeTruthy()
      expect(screen.getByTestId('step-content')).toHaveTextContent('Take me back to Browser')
    })

    it('should call proper telemetry events', () => {
      const sendEventTelemetryMock = jest.fn();
      (sendEventTelemetry as jest.Mock).mockImplementation(() => sendEventTelemetryMock)

      render(<OnboardingTour options={ONBOARDING_FEATURES.FINISH}><span /></OnboardingTour>)

      fireEvent.click(screen.getByTestId('back-btn'))
      expect(sendEventTelemetry).toBeCalledWith(getEventProperties('back', OnboardingStepName.Finish));
      (sendEventTelemetry as jest.Mock).mockRestore()

      fireEvent.click(screen.getByTestId('close-tour-btn'))
      expect(sendEventTelemetry).toBeCalledWith(getEventProperties('closed', OnboardingStepName.Finish))
      expect(sendEventTelemetry).toBeCalledWith({
        event: TelemetryEvent.ONBOARDING_TOUR_FINISHED,
        eventData: {
          databaseId: ''
        }
      });
      (sendEventTelemetry as jest.Mock).mockRestore()

      fireEvent.click(screen.getByTestId('next-btn'))
      expect(sendEventTelemetry).toBeCalledWith(getEventProperties('next', OnboardingStepName.Finish))
      expect(sendEventTelemetry).toBeCalledWith({
        event: TelemetryEvent.ONBOARDING_TOUR_FINISHED,
        eventData: {
          databaseId: ''
        }
      });
      (sendEventTelemetry as jest.Mock).mockRestore()
    })

    it('should properly push history on next', () => {
      const pushMock = jest.fn()
      reactRouterDom.useHistory = jest.fn().mockReturnValue({ push: pushMock })

      render(<OnboardingTour options={ONBOARDING_FEATURES.FINISH}><span /></OnboardingTour>)
      fireEvent.click(screen.getByTestId('next-btn'))
      expect(pushMock).toHaveBeenCalledWith(Pages.browser(''))
    })
  })
})
