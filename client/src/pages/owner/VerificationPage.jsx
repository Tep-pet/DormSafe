import { PageContainer } from '../../components/layout/PageContainer';
import { AccountVerificationPage } from '../auth/AccountVerificationPage';

export function VerificationPage() {
  return (
    <PageContainer
      title="Account Verification"
      subtitle="Upload your valid ID and business license for admin review"
    >
      <AccountVerificationPage requireLicense bare />
    </PageContainer>
  );
}
