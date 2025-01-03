/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { useMisconfigurationPreview } from '@kbn/cloud-security-posture/src/hooks/use_misconfiguration_preview';
import type { Anomalies } from '../../../../common/components/ml/types';
import { TestProviders } from '../../../../common/mock';
import { DocumentDetailsContext } from '../../shared/context';
import { UserDetails } from './user_details';
import { useMlCapabilities } from '../../../../common/components/ml/hooks/use_ml_capabilities';
import { mockAnomalies } from '../../../../common/components/ml/mock';
import { useObservedUserDetails } from '../../../../explore/users/containers/users/observed_details';
import { useUserRelatedHosts } from '../../../../common/containers/related_entities/related_hosts';
import { useIsExperimentalFeatureEnabled } from '../../../../common/hooks/use_experimental_features';
import { RiskSeverity } from '../../../../../common/search_strategy';
import {
  USER_DETAILS_TEST_ID,
  USER_DETAILS_LINK_TEST_ID,
  USER_DETAILS_INFO_TEST_ID,
  USER_DETAILS_RELATED_HOSTS_TABLE_TEST_ID,
  USER_DETAILS_RELATED_HOSTS_LINK_TEST_ID,
  USER_DETAILS_RELATED_HOSTS_IP_LINK_TEST_ID,
  USER_DETAILS_MISCONFIGURATIONS_TEST_ID,
  USER_DETAILS_ALERT_COUNT_TEST_ID,
} from './test_ids';
import { EXPANDABLE_PANEL_CONTENT_TEST_ID } from '@kbn/security-solution-common';
import { useRiskScore } from '../../../../entity_analytics/api/hooks/use_risk_score';
import { mockContextValue } from '../../shared/mocks/mock_context';
import { mockFlyoutApi } from '../../shared/mocks/mock_flyout_context';
import { useExpandableFlyoutApi } from '@kbn/expandable-flyout';
import { HostPreviewPanelKey } from '../../../entity_details/host_right';
import { HOST_PREVIEW_BANNER } from '../../right/components/host_entity_overview';
import { UserPreviewPanelKey } from '../../../entity_details/user_right';
import { USER_PREVIEW_BANNER } from '../../right/components/user_entity_overview';
import { NetworkPanelKey, NETWORK_PREVIEW_BANNER } from '../../../network_details';
import { useSummaryChartData } from '../../../../detections/components/alerts_kpis/alerts_summary_charts_panel/use_summary_chart_data';

jest.mock('@kbn/expandable-flyout');
jest.mock('@kbn/cloud-security-posture/src/hooks/use_misconfiguration_preview');

jest.mock('../../../../common/hooks/use_experimental_features');
const mockUseIsExperimentalFeatureEnabled = useIsExperimentalFeatureEnabled as jest.Mock;

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useLocation: jest.fn().mockReturnValue({ pathname: '' }) };
});

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const original = jest.requireActual('react-redux');
  return {
    ...original,
    useDispatch: () => mockDispatch,
  };
});

const from = '2022-07-20T08:20:18.966Z';
const to = '2022-07-28T08:20:18.966Z';
jest.mock('../../../../common/containers/use_global_time', () => {
  const actual = jest.requireActual('../../../../common/containers/use_global_time');
  return {
    ...actual,
    useGlobalTime: jest
      .fn()
      .mockReturnValue({ from, to, setQuery: jest.fn(), deleteQuery: jest.fn() }),
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('uuid'),
}));

jest.mock('../../../../common/components/ml/hooks/use_ml_capabilities');
const mockUseMlUserPermissions = useMlCapabilities as jest.Mock;

jest.mock('../../../../sourcerer/containers', () => ({
  useSourcererDataView: jest
    .fn()
    .mockReturnValue({ selectedPatterns: ['index'], sourcererDataView: {} }),
}));

jest.mock('../../../../common/components/ml/anomaly/anomaly_table_provider', () => ({
  AnomalyTableProvider: ({
    children,
  }: {
    children: (args: {
      anomaliesData: Anomalies;
      isLoadingAnomaliesData: boolean;
      jobNameById: Record<string, string | undefined>;
    }) => React.ReactNode;
  }) => children({ anomaliesData: mockAnomalies, isLoadingAnomaliesData: false, jobNameById: {} }),
}));

jest.mock('../../../../helper_hooks', () => ({ useHasSecurityCapability: () => true }));

jest.mock('../../../../explore/users/containers/users/observed_details');
const mockUseObservedUserDetails = useObservedUserDetails as jest.Mock;

jest.mock('../../../../common/containers/related_entities/related_hosts');
const mockUseUsersRelatedHosts = useUserRelatedHosts as jest.Mock;

jest.mock('../../../../entity_analytics/api/hooks/use_risk_score');
const mockUseRiskScore = useRiskScore as jest.Mock;

jest.mock(
  '../../../../detections/components/alerts_kpis/alerts_summary_charts_panel/use_summary_chart_data'
);

const timestamp = '2022-07-25T08:20:18.966Z';

const defaultProps = {
  userName: 'test user',
  timestamp,
  scopeId: 'scopeId',
};

const mockUserDetailsResponse = [
  false,
  {
    inspect: jest.fn(),
    refetch: jest.fn(),
    userDetails: { user: { name: ['test user'] } },
  },
];

const mockRiskScoreResponse = {
  data: [
    {
      user: {
        name: 'test user',
        risk: { calculated_level: 'low', calculated_score_norm: 40 },
      },
    },
  ],
  isAuthorized: true,
};

const mockRelatedHostsResponse = {
  inspect: jest.fn(),
  refetch: jest.fn(),
  relatedHosts: [{ host: 'test host', ip: ['100.XXX.XXX'], risk: RiskSeverity.Low }],
  loading: false,
};

const renderUserDetails = (contextValue: DocumentDetailsContext) =>
  render(
    <TestProviders>
      <DocumentDetailsContext.Provider value={contextValue}>
        <UserDetails {...defaultProps} />
      </DocumentDetailsContext.Provider>
    </TestProviders>
  );

describe('<UserDetails />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useExpandableFlyoutApi).mockReturnValue(mockFlyoutApi);
    mockUseMlUserPermissions.mockReturnValue({ isPlatinumOrTrialLicense: false, capabilities: {} });
    mockUseObservedUserDetails.mockReturnValue(mockUserDetailsResponse);
    mockUseRiskScore.mockReturnValue(mockRiskScoreResponse);
    mockUseUsersRelatedHosts.mockReturnValue(mockRelatedHostsResponse);
    mockUseIsExperimentalFeatureEnabled.mockReturnValue(true);
    (useMisconfigurationPreview as jest.Mock).mockReturnValue({});
    (useSummaryChartData as jest.Mock).mockReturnValue({ isLoading: false, items: [] });
  });

  it('should render user details correctly', () => {
    const { getByTestId, queryByTestId } = renderUserDetails(mockContextValue);
    expect(getByTestId(EXPANDABLE_PANEL_CONTENT_TEST_ID(USER_DETAILS_TEST_ID))).toBeInTheDocument();
    expect(queryByTestId(USER_DETAILS_LINK_TEST_ID)).not.toBeInTheDocument();
  });

  it('should render user name as clicable link when feature flag is true', () => {
    mockUseIsExperimentalFeatureEnabled.mockReturnValue(false);
    const { getByTestId } = renderUserDetails(mockContextValue);
    expect(getByTestId(USER_DETAILS_LINK_TEST_ID)).toBeInTheDocument();

    getByTestId(USER_DETAILS_LINK_TEST_ID).click();
    expect(mockFlyoutApi.openPreviewPanel).toHaveBeenCalledWith({
      id: UserPreviewPanelKey,
      params: {
        userName: defaultProps.userName,
        scopeId: defaultProps.scopeId,
        banner: USER_PREVIEW_BANNER,
      },
    });
  });

  describe('Host overview', () => {
    it('should render the HostOverview with correct dates and indices', () => {
      const { getByTestId } = renderUserDetails(mockContextValue);
      expect(mockUseObservedUserDetails).toBeCalledWith({
        id: 'entities-users-details-uuid',
        startDate: from,
        endDate: to,
        userName: 'test user',
        indexNames: ['index'],
        skip: false,
      });
      expect(getByTestId(USER_DETAILS_INFO_TEST_ID)).toBeInTheDocument();
    });

    it('should render user risk score when license is valid', () => {
      mockUseMlUserPermissions.mockReturnValue({
        isPlatinumOrTrialLicense: true,
        capabilities: {},
      });
      const { getByText } = renderUserDetails(mockContextValue);
      expect(getByText('User risk score')).toBeInTheDocument();
    });

    it('should not render user risk score when license is not valid', () => {
      mockUseRiskScore.mockReturnValue({ data: [], isAuthorized: false });
      const { queryByText } = renderUserDetails(mockContextValue);
      expect(queryByText('User risk score')).not.toBeInTheDocument();
    });
  });

  describe('Related hosts', () => {
    it('should render the related host table with correct dates and indices', () => {
      const { getByTestId, queryByTestId } = renderUserDetails(mockContextValue);
      expect(mockUseUsersRelatedHosts).toBeCalledWith({
        from: timestamp,
        userName: 'test user',
        indexNames: ['index'],
        skip: false,
      });
      expect(getByTestId(USER_DETAILS_RELATED_HOSTS_TABLE_TEST_ID)).toBeInTheDocument();
      expect(queryByTestId(USER_DETAILS_RELATED_HOSTS_LINK_TEST_ID)).not.toBeInTheDocument();
    });

    it('should render host risk score column when license is valid', () => {
      mockUseMlUserPermissions.mockReturnValue({
        isPlatinumOrTrialLicense: true,
        capabilities: {},
      });
      const { queryAllByRole } = renderUserDetails(mockContextValue);
      expect(queryAllByRole('columnheader').length).toBe(3);
      expect(queryAllByRole('row')[1].textContent).toContain('test host');
      expect(queryAllByRole('row')[1].textContent).toContain('100.XXX.XXX');
      expect(queryAllByRole('row')[1].textContent).toContain('Low');
    });

    it('should not render host risk score column when license is not valid', () => {
      const { queryAllByRole } = renderUserDetails(mockContextValue);
      expect(queryAllByRole('columnheader').length).toBe(2);
    });

    it('should render empty table if no related host is returned', () => {
      mockUseUsersRelatedHosts.mockReturnValue({
        ...mockRelatedHostsResponse,
        relatedHosts: [],
        loading: false,
      });

      const { getByTestId } = renderUserDetails(mockContextValue);
      expect(getByTestId(USER_DETAILS_RELATED_HOSTS_TABLE_TEST_ID).textContent).toContain(
        'No hosts identified'
      );
    });

    it('should render host name and ip as clicable link when preview is enabled', () => {
      mockUseIsExperimentalFeatureEnabled.mockReturnValue(false);
      const { getAllByTestId } = renderUserDetails(mockContextValue);
      expect(getAllByTestId(USER_DETAILS_RELATED_HOSTS_LINK_TEST_ID).length).toBe(1);

      getAllByTestId(USER_DETAILS_RELATED_HOSTS_LINK_TEST_ID)[0].click();
      expect(mockFlyoutApi.openPreviewPanel).toHaveBeenCalledWith({
        id: HostPreviewPanelKey,
        params: {
          hostName: 'test host',
          scopeId: defaultProps.scopeId,
          banner: HOST_PREVIEW_BANNER,
        },
      });

      getAllByTestId(USER_DETAILS_RELATED_HOSTS_IP_LINK_TEST_ID)[0].click();
      expect(mockFlyoutApi.openPreviewPanel).toHaveBeenCalledWith({
        id: NetworkPanelKey,
        params: {
          ip: '100.XXX.XXX',
          flowTarget: 'source',
          banner: NETWORK_PREVIEW_BANNER,
        },
      });
    });
  });

  describe('distribution bar insights', () => {
    it('should not render if no data is available', () => {
      const { queryByTestId } = renderUserDetails(mockContextValue);
      expect(queryByTestId(USER_DETAILS_MISCONFIGURATIONS_TEST_ID)).not.toBeInTheDocument();
      expect(queryByTestId(USER_DETAILS_ALERT_COUNT_TEST_ID)).not.toBeInTheDocument();
    });

    it('should render alert count when data is available', () => {
      (useSummaryChartData as jest.Mock).mockReturnValue({
        isLoading: false,
        items: [{ key: 'high', value: 78, label: 'High' }],
      });

      const { getByTestId } = renderUserDetails(mockContextValue);
      expect(getByTestId(USER_DETAILS_ALERT_COUNT_TEST_ID)).toBeInTheDocument();
    });

    it('should render misconfiguration when data is available', () => {
      (useMisconfigurationPreview as jest.Mock).mockReturnValue({
        data: { count: { passed: 1, failed: 2 } },
      });

      const { getByTestId } = renderUserDetails(mockContextValue);
      expect(getByTestId(USER_DETAILS_MISCONFIGURATIONS_TEST_ID)).toBeInTheDocument();
    });
  });
});
