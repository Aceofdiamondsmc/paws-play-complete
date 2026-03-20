import { forwardRef } from 'react';

interface FlyerTemplateProps {
  dogName: string;
  breed?: string | null;
  avatarUrl?: string | null;
  lastSeenLocation: string;
  contactPhone: string;
  reward?: string;
  alertUrl: string;
  qrImageUrl?: string;
}

const getQrCodeUrl = (url: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

const FlyerTemplate = forwardRef<HTMLDivElement, FlyerTemplateProps>(
  ({ dogName, breed, avatarUrl, lastSeenLocation, contactPhone, reward, alertUrl }, ref) => {
    return (
      <div ref={ref} id="flyer-template" className="block bg-white p-8">
        <div className="w-[8.5in] h-[11in] mx-auto p-8 bg-white text-black font-sans flex flex-col">
          <div className="text-center border-4 border-black p-4 mb-6">
            <h1 className="text-5xl font-black tracking-wider">MISSING DOG</h1>
            <p className="text-xl font-bold mt-1">PLEASE HELP US FIND OUR FAMILY MEMBER</p>
          </div>

          {avatarUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={avatarUrl}
                alt={dogName}
                className="w-96 h-96 object-cover border-4 border-black rounded-lg"
              />
            </div>
          )}

          <div className="text-center mb-4">
            <h2 className="text-4xl font-black">{dogName}</h2>
            {breed && <p className="text-2xl font-semibold mt-1">{breed}</p>}
          </div>

          <div className="bg-gray-100 border-2 border-black rounded-lg p-4 mb-4 text-center">
            <p className="text-lg font-bold">LAST SEEN</p>
            <p className="text-xl">{lastSeenLocation}</p>
          </div>

          {reward && (
            <div className="bg-yellow-300 border-2 border-black rounded-lg p-4 mb-4 text-center">
              <p className="text-2xl font-black">💰 REWARD: {reward}</p>
              <p className="text-sm font-semibold">FOR SAFE RETURN</p>
            </div>
          )}

          <div className="border-4 border-black rounded-lg p-6 text-center mb-4 flex-1 flex flex-col justify-center">
            <p className="text-xl font-bold mb-2">CONTACT OWNER</p>
            <p className="text-5xl font-black tracking-wider">{contactPhone}</p>
          </div>

          <div className="flex items-end justify-between mt-auto">
            <p className="text-xs text-gray-500">Created on PawsPlayRepeat.com</p>
            <div className="flex flex-col items-center">
              <img
                src={getQrCodeUrl(alertUrl)}
                alt="Scan for more info"
                className="w-24 h-24 border-2 border-black p-1"
              />
              <p className="text-xs font-bold mt-1 text-center max-w-[120px] leading-tight">
                SCAN FOR MORE PHOTOS & LIVE UPDATES
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FlyerTemplate.displayName = 'FlyerTemplate';

/**
 * Generates a standalone HTML string for the lost dog flyer.
 * Used to open in a new window for printing — no Tailwind or app dependencies.
 */
export function generateFlyerHTML(props: FlyerTemplateProps & { printOnLoad?: boolean }): string {
  const { dogName, breed, avatarUrl, lastSeenLocation, contactPhone, reward, alertUrl, qrImageUrl, printOnLoad } = props;
  const qrUrl = qrImageUrl || getQrCodeUrl(alertUrl);

  const photoBlock = avatarUrl
    ? `<div style="text-align:center;margin-bottom:24px;">
        <img src="${avatarUrl}" alt="${dogName}" style="width:384px;height:384px;object-fit:cover;border:4px solid #000;border-radius:8px;image-rendering:-webkit-optimize-contrast;" />
      </div>`
    : `<div style="text-align:center;margin-bottom:24px;">
        <div style="width:384px;height:384px;margin:0 auto;border:4px solid #000;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;">
          <div style="text-align:center;">
            <p style="font-size:72px;margin:0;">🐕</p>
            <p style="font-size:28px;font-weight:900;margin:8px 0 0;">${dogName}</p>
          </div>
        </div>
      </div>`;

  const rewardBlock = reward
    ? `<div style="background:#fde047;border:2px solid #000;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;">
        <p style="font-size:24px;font-weight:900;margin:0;">💰 REWARD: ${reward}</p>
        <p style="font-size:12px;font-weight:600;margin:4px 0 0;">FOR SAFE RETURN</p>
      </div>`
    : '';

  const printScript = printOnLoad
    ? `<script>window.onload = function() { window.print(); };<\/script>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Missing Dog - ${dogName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    @media print {
      body { margin: 0; }
      @page { size: letter; margin: 0.5in; }
    }
  </style>
</head>
<body>
  <div style="width:8.5in;min-height:11in;margin:0 auto;padding:32px;display:flex;flex-direction:column;">
    <!-- Header -->
    <div style="text-align:center;border:4px solid #000;padding:16px;margin-bottom:24px;">
      <h1 style="font-size:48px;font-weight:900;letter-spacing:2px;">MISSING DOG</h1>
      <p style="font-size:20px;font-weight:700;margin-top:4px;">PLEASE HELP US FIND OUR FAMILY MEMBER</p>
    </div>

    ${photoBlock}

    <!-- Dog Info -->
    <div style="text-align:center;margin-bottom:16px;">
      <h2 style="font-size:36px;font-weight:900;">${dogName}</h2>
      ${breed ? `<p style="font-size:24px;font-weight:600;margin-top:4px;">${breed}</p>` : ''}
    </div>

    <!-- Last Seen -->
    <div style="background:#f3f4f6;border:2px solid #000;border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;">
      <p style="font-size:18px;font-weight:700;">LAST SEEN</p>
      <p style="font-size:20px;">${lastSeenLocation}</p>
    </div>

    ${rewardBlock}

    <!-- Contact -->
    <div style="border:4px solid #000;border-radius:8px;padding:24px;text-align:center;margin-bottom:16px;flex:1;display:flex;flex-direction:column;justify-content:center;">
      <p style="font-size:20px;font-weight:700;margin-bottom:8px;">CONTACT OWNER</p>
      <p style="font-size:48px;font-weight:900;letter-spacing:2px;">${contactPhone}</p>
    </div>

    <!-- Footer with QR -->
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:auto;">
      <p style="font-size:11px;color:#6b7280;">Created on PawsPlayRepeat.com</p>
      <div style="display:flex;flex-direction:column;align-items:center;">
        <img src="${qrUrl}" alt="QR Code" style="width:96px;height:96px;border:2px solid #000;padding:4px;" />
        <p style="font-size:11px;font-weight:700;margin-top:4px;text-align:center;max-width:120px;line-height:1.3;">
          SCAN FOR MORE PHOTOS & LIVE UPDATES
        </p>
      </div>
    </div>
  </div>

  ${printScript}
</body>
</html>`;
}

export default FlyerTemplate;
