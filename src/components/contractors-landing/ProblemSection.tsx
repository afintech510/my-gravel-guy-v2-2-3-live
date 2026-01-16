import React from 'react';
import { MapPin, DollarSign, ArrowLeftRight, Clock, Phone, User } from 'lucide-react';

const ProblemSection: React.FC = () => {
  const painPoints = [
    {
      title: 'New city, no trusted supplier',
      icon: MapPin,
    },
    {
      title: 'Inconsistent pricing and availability',
      icon: DollarSign,
    },
    {
      title: 'Trucking is the bottleneck',
      icon: ArrowLeftRight,
    },
    {
      title: 'Tight schedules + last-minute changes',
      icon: Clock,
    },
    {
      title: 'Too many vendors, too many calls',
      icon: Phone,
    },
    {
      title: 'You need one point of contact',
      icon: User,
    },
  ];

  return (
    <section className="bg-[#151A22] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F7FA] mb-4">
            Sound familiar?
          </h2>
          <p className="text-lg text-[#B7C0CC]">
            Construction PMs face the same sourcing headaches on every job.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {painPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={index}
                className="bg-[#0F1115] border border-[rgba(255,255,255,0.10)] rounded-xl p-6 flex items-center gap-4 hover:border-[#BADF24]/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-[#F5F7FA] font-medium">{point.title}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-[#B7C0CC]">
            We built{' '}
            <span className="text-[#BADF24] font-medium">MyGravelGuy</span> to
            solve these problems.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
