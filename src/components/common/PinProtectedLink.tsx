import React, { useState } from 'react';
import { childSafetyGuardService } from '../../services/security/childSafetyGuardService';
import { PinGateModal } from '../auth/PinGateModal';
import { ExternalLink } from 'lucide-react';

interface PinProtectedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export const PinProtectedLink: React.FC<PinProtectedLinkProps> = ({
  href,
  children,
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer',
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const isExternal = childSafetyGuardService.isExternalUrl(href);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isExternal) {
      e.preventDefault();
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    // Proceed to external URL safely with secure attributes
    window.open(href, target, 'noopener,noreferrer');
  };

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        target={target}
        rel={rel}
        className={`inline-flex items-center space-x-1 ${className}`}
      >
        <span>{children}</span>
        {isExternal && <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1 inline" />}
      </a>

      {showPinModal && (
        <PinGateModal
          isOpen={showPinModal}
          onSuccess={handlePinSuccess}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </>
  );
};
