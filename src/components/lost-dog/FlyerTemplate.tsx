import { forwardRef } from 'react';

interface FlyerTemplateProps {
  dogName: string;
  breed?: string | null;
  avatarUrl?: string | null;
  lastSeenLocation: string;
  contactPhone: string;
  reward?: string;
  alertUrl: string;
}

const FlyerTemplate = forwardRef<HTMLDivElement, FlyerTemplateProps>(
  ({ dogName, breed, avatarUrl, lastSeenLocation, contactPhone, reward, alertUrl }, ref) => {
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(alertUrl)}&choe=UTF-8`;

    return (
      <div ref={ref} id="flyer-template" className="hidden print:block">
        <div className="w-[8.5in] h-[11in] mx-auto p-8 bg-white text-black font-sans flex flex-col">
          {/* Header */}
          <div className="text-center border-4 border-black p-4 mb-6">
            <h1 className="text-5xl font-black tracking-wider">MISSING DOG</h1>
            <p className="text-xl font-bold mt-1">PLEASE HELP US FIND OUR FAMILY MEMBER</p>
          </div>

          {/* Dog Photo */}
          {avatarUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={avatarUrl}
                alt={dogName}
                className="w-72 h-72 object-cover border-4 border-black rounded-lg"
              />
            </div>
          )}

          {/* Dog Info */}
          <div className="text-center mb-4">
            <h2 className="text-4xl font-black">{dogName}</h2>
            {breed && <p className="text-2xl font-semibold mt-1">{breed}</p>}
          </div>

          {/* Last Seen */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-4 mb-4 text-center">
            <p className="text-lg font-bold">LAST SEEN</p>
            <p className="text-xl">{lastSeenLocation}</p>
          </div>

          {/* Reward */}
          {reward && (
            <div className="bg-yellow-300 border-2 border-black rounded-lg p-4 mb-4 text-center">
              <p className="text-2xl font-black">💰 REWARD: {reward}</p>
              <p className="text-sm font-semibold">FOR SAFE RETURN</p>
            </div>
          )}

          {/* Contact */}
          <div className="border-4 border-black rounded-lg p-6 text-center mb-4 flex-1 flex flex-col justify-center">
            <p className="text-xl font-bold mb-2">CONTACT OWNER</p>
            <p className="text-5xl font-black tracking-wider">{contactPhone}</p>
          </div>

          {/* QR Code */}
          <div className="flex items-end justify-between mt-auto">
            <p className="text-xs text-gray-500">Created on PawsPlayRepeat.com</p>
            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
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

export default FlyerTemplate;
