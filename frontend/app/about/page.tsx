import Image from 'next/image';

export default function AboutPage() {
  const team = [
    { 
      name: 'Muhammad Hazim Robbani', 
      nim : '10123280',
      // role: 'Full Stack Developer',
      contribution: '100%', 
      image: '/images/hazim.jpg'
    },
    { 
      name: 'Sierly Putri Anjani', 
      nim : '10123915',
      // role: 'Developer',
      contribution: '100%', 
      image: '/images/sierly.jpg' 
    },
    { 
      name: 'Muhamad Iqbal Reza', 
      nim : '10123292',
      // role: 'Developer',
      contribution: '100%', 
      image: '/images/iqbal.jpg' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-web3-bg-primary to-web3-bg-secondary py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Tim Kami</span>
          </h1>
          <p className="text-xl text-web3-text-secondary max-w-2xl mx-auto">
            Kenali pengembang bersemangat di balik Fishit Marketplace
          </p>
          <div className="mt-4 h-1 w-24 bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple mx-auto rounded-full"></div>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
            {team.map((member, index) => (
              <div 
                key={member.name} 
                className="group glass-card rounded-2xl p-8 border border-white/10 hover:border-web3-accent-cyan/50 transition-all duration-300 hover:scale-105 hover:shadow-glow-cyan"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >

                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-web3-accent-cyan/30 group-hover:border-web3-accent-cyan transition-colors">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                </div>

                {/* Member Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-web3-accent-cyan transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-web3-accent-purple font-semibold mb-3">
                    {member.nim}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-web3-accent-green/20 to-web3-accent-cyan/20 border border-web3-accent-green/30">
                    <span className="text-web3-accent-green font-bold">
                      {member.contribution}
                    </span>
                    <span className="text-web3-text-secondary text-sm">
                      Kontribusi
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mt-20 glass-card rounded-2xl p-10 border border-white/10 text-center">
          <h2 className="text-3xl font-bold mb-4 gradient-text">Our Mission</h2>
          <p className="text-lg text-web3-text-secondary max-w-3xl mx-auto leading-relaxed">
            We're dedicated to creating the best marketplace experience for gamers. 
            Our platform combines cutting-edge technology with a passion for gaming 
            to deliver fast, secure, and reliable transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
