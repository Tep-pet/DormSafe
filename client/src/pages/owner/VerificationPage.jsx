import { AccountVerificationPage } from '../auth/AccountVerificationPage';

export function VerificationPage() {
  return (
    <AccountVerificationPage
      title="Property Owner Verification"
      subtitle="Your business permit and valid ID are reviewed by an administrator before your listings become publicly active."
      requireLicense={true}
    />
  );
}
