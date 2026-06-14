          {/* SCIENCE TAB */}
          {activeTab === 'science' && (
            <div className="w-full max-w-md flex flex-col items-center flex-grow px-2 pb-32 text-left">
              <div className="w-full mb-6">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="mb-4 text-cyan-400 text-[10px] font-bold uppercase flex items-center gap-1 hover:text-white transition-colors"
                >
                  ◀ {language === 'TR' ? 'Ana Ekrana Dön' : 'Back to Home'}
                </button>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-widest uppercase mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  {language === 'TR' ? 'Hakkımızda & Bilimsel Temellerimiz' : 'About Us & Scientific Foundations'}
                </h2>
                
                <div className="space-y-4 text-[11px] text-gray-300 leading-relaxed font-body">
                  <div className="bg-[#111625]/90 border border-gray-800 rounded-xl p-4 shadow-md">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 border-b border-gray-800 pb-2">
                      {language === 'TR' ? 'Biz Kimiz?' : 'Who Are We?'}
                    </h3>
                    <p className="mb-3">
                      <strong className="text-cyan-400">memolandum.com</strong>, {language === 'TR' ? 'geleneksel ve sıkıcı öğrenme metotlarını geride bırakarak, kalıcı hafıza yönetimini küresel bir oyun ekosistemine dönüştüren yeni nesil bir platformdur. Amacımız; kullanıcılarımızın yeni bir dil öğrenirken veya teknik terimlere hakim olmaya çalışırken bilişsel potansiyellerini maksimuma çıkarmak ve bu kazanımlarla kendi hayatlarını domine edecek bir kişisel gelişim ivmesi yakalamalarını sağlamaktır.' : 'is a next-generation platform that leaves traditional and boring learning methods behind, transforming permanent memory management into a global gaming ecosystem. Our goal is to maximize the cognitive potential of our users while learning a new language or mastering technical terms, enabling them to gain a personal development momentum that will dominate their own lives.'}
                    </p>
                    <p>
                      {language === 'TR' ? 'Peki, bunu nasıl yapıyoruz? Sadece eğlenceli oyun tasarımlarıyla değil; insan beyninin çalışma prensiplerini çözen nörobilim, bilişsel psikoloji ve dijital oyun teknolojilerinin evrimsel disipliniyle hareket ediyoruz.' : 'How do we do this? Not just with fun game designs; we act with the evolutionary discipline of neuroscience, cognitive psychology, and digital game technologies that solve the working principles of the human brain.'}
                    </p>
                  </div>

                  <h3 className="text-sm font-black text-yellow-400 uppercase tracking-widest mt-6 mb-2 border-b border-gray-800 pb-2">
                    {language === 'TR' ? 'Gücümüzü Bilim, Disiplin ve Teknolojiden Alıyoruz' : 'Powered by Science, Discipline, and Technology'}
                  </h3>
                  <p className="text-[10px] text-gray-400 mb-4">
                    {language === 'TR' ? 'Geliştirdiğimiz oyun modülleri ve kelime edinim algoritmaları, doğrudan aşağıdaki akademik teoriler ve teknolojik vizyon üzerine inşa edilmiştir:' : 'The game modules and vocabulary acquisition algorithms we developed are directly built upon the following academic theories and technological vision:'}
                  </p>

                  <div className="bg-[#111625]/90 border-l-2 border-emerald-500 rounded-r-xl p-4 shadow-md">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex gap-2">
                      <span className="text-emerald-400">01.</span> {language === 'TR' ? 'Subliminal ve Örtük Öğrenme (Subliminal & Implicit Learning)' : 'Subliminal & Implicit Learning'}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {language === 'TR' ? 'İnsan beyni, bilincin aktif olarak algılayamadığı "eşik altı" (subliminal) uyaranları işleme ve kaydetme yeteneğine sahiptir. Psikolojide Implicit Learning (Örtük Öğrenme) olarak adlandırılan bu süreç, bireyin farkında olmadan, çevreyle etkileşime girerek kuralları ve kalıpları hafızasına kazımasıdır.' : 'The human brain has the ability to process and record "subliminal" stimuli that consciousness cannot actively perceive. This process, called Implicit Learning in psychology, is the individual\'s engraving of rules and patterns into their memory by interacting with the environment without realizing it.'}
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Bilimsel Çözümümüz:</strong> {language === 'TR' ? 'memolandum.com\'un dinamik oyun motorlarında, siz sadece ekrandaki ana hedefe odaklanmışken, arka planda, renk geçişlerinde veya oyunun mikro saniyelik akışlarında (periferik vizyon alanınızda) hedef dildeki kelime kalıpları ve görsel eşleşmeler beyninize servis edilir. Farkında olmadan, oynamanın getirdiği yüksek odaklanma (Hyper-focus) anında, kelimeler bilinçaltı düzeyde zihninize işlenir. Skor üretmeye çalışırken, beyniniz arka planda dili doğal kodlarıyla öğrenir.' : 'In the dynamic game engines of memolandum.com, while you only focus on the main target on the screen, word patterns and visual matches in the target language are served to your brain in the background, in color transitions, or in the micro-second flows of the game (in your peripheral vision area). Without realizing it, in the moment of high focus (Hyper-focus) brought by playing, words are processed into your mind at a subconscious level. While trying to produce a score, your brain learns the language with its natural codes in the background.'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border-l-2 border-cyan-500 rounded-r-xl p-4 shadow-md">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex gap-2">
                      <span className="text-cyan-400">02.</span> {language === 'TR' ? 'Atariler ve Bilişimin "Sıfır Noktası" Felsefesi' : 'Arcades and the "Ground Zero" Philosophy of Computing'}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {language === 'TR' ? '70\'lerin ve 80\'lerin atari (arcade) salonları, sadece piksellerden oluşan eğlence araçları değildi; bugün yapay zekadan uzay teknolojilerine kadar dünyayı domine eden modern bilişim sektörünün sıfır noktasıydı. Atari mühendislerinin kısıtlı donanımlarla yarattığı o kusursuz oyun döngüleri (game loop) ve insanı ekrana bağlayan yüksek odaklanma mekanikleri, bugünkü devasa dijital dönüşümün temellerini attı.' : 'The arcade halls of the 70s and 80s were not just entertainment vehicles consisting of pixels; they were the ground zero of the modern informatics sector that dominates the world today, from artificial intelligence to space technologies. The flawless game loops created by arcade engineers with limited hardware and the high focus mechanics that bound people to the screen laid the foundations of today\'s massive digital transformation.'}
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Vizyonumuz:</strong> {language === 'TR' ? 'Atarilerin oyun endüstrisini sıfırdan alıp bugün dünyayı yöneten bir bilişim gücü haline getirmesi gibi, memolandum.com da oyunlaştırmanın bu saf, köklü ve güçlü enerjisini disiplinle işler. Şu an aktif olan altı temel oyun modülümüz, bu evrimin sadece ilk adımıdır. Geliştirme laboratuvarımızda sürekli yeni retro ve arcade mekanikleri üretiyor, oyun kütüphanemizi durmaksızın genişletiyoruz. Tıpkı oyun sektörünün dünyayı domine etmesi gibi, siz de memolandum.com oyun teknolojileriyle zihninizi geliştirerek kendi hayatınızı ve kariyerinizi domine edecek noktaya geleceksiniz.' : 'Just as arcades took the gaming industry from scratch and turned it into an informatics power that rules the world today, memolandum.com also processes this pure, deep-rooted, and powerful energy of gamification with discipline. Our six currently active basic game modules are just the first step of this evolution. We are constantly producing new retro and arcade mechanics in our development laboratory and expanding our game library non-stop. Just as the gaming industry dominates the world, you will also reach the point of dominating your own life and career by developing your mind with memolandum.com gaming technologies.'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border-l-2 border-yellow-500 rounded-r-xl p-4 shadow-md">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex gap-2">
                      <span className="text-yellow-400">03.</span> {language === 'TR' ? 'Ebbinghaus Unutma Eğrisi ve Aralıklı Tekrar (Spaced Repetition)' : 'Ebbinghaus Forgetting Curve and Spaced Repetition'}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {language === 'TR' ? '1885 yılında psikolog Hermann Ebbinghaus tarafından keşfedilen Unutma Eğrisi (Forgetting Curve), yeni öğrenilen bilgilerin tekrar edilmediği takdirde geometrik bir hızla unutulduğunu gösterir.' : 'The Forgetting Curve, discovered by psychologist Hermann Ebbinghaus in 1885, shows that newly learned information is forgotten at a geometric rate if not repeated.'}
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Bilimsel Çözümümüz:</strong> {language === 'TR' ? 'memolandum.com algoritmaları, bir kelimeyi veya bilgiyi tam unutmak üzere olduğunuz o kritik "kırılma anını" hesaplar. Geliştirdiğimiz retro oyun modülleri, bu kelimeleri tam zamanında (Aralıklı Tekrar yöntemiyle) karşınıza çıkararak bilginin kısa süreli bellekten kalıcı hafızaya (long-term memory) transfer edilmesini sağlar.' : 'memolandum.com algorithms calculate that critical "breaking point" when you are about to completely forget a word or information. The retro game modules we developed present these words to you right on time (with the Spaced Repetition method), ensuring that the information is transferred from short-term memory to long-term memory.'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border-l-2 border-purple-500 rounded-r-xl p-4 shadow-md">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex gap-2">
                      <span className="text-purple-400">04.</span> {language === 'TR' ? 'İkili Kodlama Teorisi (Dual-Coding Theory)' : 'Dual-Coding Theory'}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {language === 'TR' ? 'Allan Paivio’nun İkili Kodlama Teorisi, insan beyninin bilgiyi hem görsel hem de sözel (metinsel) kanallardan ayrı ayrı işlediğini savunur. Bilgi her iki kanaldan birden girdiğinde, akılda kalıcılık oranı katlanarak artar.' : 'Allan Paivio’s Dual-Coding Theory argues that the human brain processes information separately from both visual and verbal (textual) channels. When information enters from both channels at the same time, the retention rate increases exponentially.'}
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Bilimsel Çözümümüz:</strong> {language === 'TR' ? 'Platformumuzdaki özel HTML5 Canvas tabanlı görsel oyun motorları ve dinamik kelime yerleştirme algoritmaları, metinsel veriyi dinamik görsel uyaranlarla birleştirir. Sadece okumaz, aynı zamanda görür, tepki verir ve mekansal hafızanızı (spatial memory) tetiklersiniz.' : 'The special HTML5 Canvas-based visual game engines and dynamic word placement algorithms on our platform combine textual data with dynamic visual stimuli. You not only read but also see, react, and trigger your spatial memory.'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border-l-2 border-red-500 rounded-r-xl p-4 shadow-md">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex gap-2">
                      <span className="text-red-400">05.</span> {language === 'TR' ? 'Akış Teorisi ve Oyunlaştırma (Flow Theory & Gamification)' : 'Flow Theory & Gamification'}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {language === 'TR' ? 'Mihaly Csikszentmihalyi tarafından ortaya konan Akış (Flow) Teorisi, bir bireyin beceri düzeyi ile karşılaştığı zorluk dengelendiğinde "pürüzsüz bir odaklanma" evresine girdiğini kanıtlar.' : 'The Flow Theory, put forward by Mihaly Csikszentmihalyi, proves that when an individual\'s skill level and the difficulty they face are balanced, they enter a phase of "smooth focus".'}
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Bilimsel Çözümümüz:</strong> {language === 'TR' ? 'Oyun modüllerimiz, kullanıcının anlık kelime ve kavram hakimiyetine göre dinamik olarak zorlaşır veya kolaylaşır. Bu sayede beyin, dopamin salınımını dengede tutarak öğrenme sürecini bir "yük" olarak değil, sürdürülebilir bir "pozitif bağımlılık" olarak algılar.' : 'Our game modules dynamically become harder or easier according to the user\'s instant word and concept mastery. In this way, the brain keeps dopamine release in balance and perceives the learning process not as a "burden" but as a sustainable "positive addiction".'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border-l-2 border-orange-500 rounded-r-xl p-4 shadow-md">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 flex gap-2">
                      <span className="text-orange-400">06.</span> {language === 'TR' ? 'Aktif Geri Çağırma (Active Recall)' : 'Active Recall'}
                    </h4>
                    <p className="text-gray-400 mb-2">
                      {language === 'TR' ? 'Bilimsel araştırmalar, beynin bilgiyi pasif bir şekilde okuduğunda değil, "içeriden dışarıya çağırmaya" (test edilmeye) zorlandığında güçlü sinaptik bağlar kurduğunu gösterir.' : 'Scientific research shows that the brain establishes strong synaptic connections not when it passively reads information, but when it is forced to "recall from the inside out" (be tested).'}
                    </p>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Bilimsel Çözümümüz:</strong> {language === 'TR' ? 'memolandum.com size kelimeleri ezberletmez; arcade mekanikleriyle sizi o bilgiyi refleksif olarak geri çağırmaya (Active Recall) zorlar. Skor üretme ve zamana karşı yarışma içgüdüsü, nöral yolları hızlandırır.' : 'memolandum.com does not make you memorize words; with arcade mechanics, it forces you to reflexively recall that information (Active Recall). The instinct to produce scores and race against time accelerates neural pathways.'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border border-gray-700 rounded-xl p-4 mt-8">
                    <h3 className="text-sm font-black text-cyan-400 tracking-widest uppercase mb-2 border-b border-gray-800 pb-2">
                      {language === 'TR' ? 'Küresel Vizyon: Sınırsız Dil, Sınırsız Gelişim' : 'Global Vision: Boundless Language, Boundless Development'}
                    </h3>
                    <p className="mb-3">
                      {language === 'TR' ? 'memolandum.com sadece İngilizce öğrenmek isteyenler için tasarlanmış lokal bir araç değildir. Kısa süre içinde platformumuza eklenecek olan tüm dünya dilleri (İspanyolca, Almanca, Japonca, Fransızca, Çince ve daha fazlası) ile sistem, küresel bir çoklu dil (multi-language) edinim merkezine dönüşecektir.' : 'memolandum.com is not a local tool designed only for those who want to learn English. With all the world languages (Spanish, German, Japanese, French, Chinese, and more) to be added to our platform soon, the system will turn into a global multi-language acquisition center.'}
                    </p>
                    <p>
                      {language === 'TR' ? 'Öğrendiğiniz her yeni dil, dünya bilişim ve iş ekosisteminde size yeni bir kapı açar. memolandum.com\'un sunduğu bu bilimsel altyapıyla bir dili bitirip diğerine geçebilir, bilişsel sınırlarınızı esnetebilir ve kişisel gelişiminizi global standartların üzerine çıkarabilirsiniz. Tıpkı sıfır noktasından başlayan atari piksellerinin bugün dünyayı yönetmesi gibi, siz de sıfırdan başlayarak dünya dillerine hakim olacak ve geleceğinizi kendiniz inşa edeceksiniz.' : 'Every new language you learn opens a new door for you in the world informatics and business ecosystem. With this scientific infrastructure offered by memolandum.com, you can finish one language and move on to the other, stretch your cognitive boundaries, and raise your personal development above global standards. Just as arcade pixels starting from ground zero rule the world today, you will also start from scratch, master world languages, and build your future yourself.'}
                    </p>
                  </div>

                  <div className="bg-[#111625]/90 border border-gray-700 rounded-xl p-4 mt-8">
                    <h3 className="text-sm font-black text-yellow-400 tracking-widest uppercase mb-4 border-b border-gray-800 pb-2">
                      {language === 'TR' ? 'Neden memolandum.com?' : 'Why memolandum.com?'}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <span className="text-cyan-400 mt-1">✓</span>
                        <span><strong className="text-white">{language === 'TR' ? 'Eşik Altı (Subliminal) Güç:' : 'Subliminal Power:'}</strong> {language === 'TR' ? 'Oyun oynarken farkında olmadan, örtük öğrenme mekanizmalarıyla kalıcı dil edinimi.' : 'Permanent language acquisition with implicit learning mechanisms without realizing it while playing games.'}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400 mt-1">✓</span>
                        <span><strong className="text-white">{language === 'TR' ? 'Sürekli Genişleyen Arcade Kütüphanesi:' : 'Ever-Expanding Arcade Library:'}</strong> {language === 'TR' ? '6 oyunla sınırlı kalmayan, durmadan büyüyen ve evrilen retro oyun modülleri.' : 'Retro game modules that are not limited to 6 games, constantly growing and evolving.'}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400 mt-1">✓</span>
                        <span><strong className="text-white">{language === 'TR' ? 'Küresel Dil Havuzu:' : 'Global Language Pool:'}</strong> {language === 'TR' ? 'Zaman içinde eklenecek tüm dünya dilleriyle, entelektüel ve profesyonel hayatınızı domine etme fırsatı.' : 'The opportunity to dominate your intellectual and professional life with all world languages to be added over time.'}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400 mt-1">✓</span>
                        <span><strong className="text-white">{language === 'TR' ? 'Kalıcı Kelime Edinimi:' : 'Permanent Vocabulary Acquisition:'}</strong> {language === 'TR' ? 'Günde sadece 10 dakika oynayarak, geleneksel yöntemlere göre %400 daha hızlı ve kalıcı öğrenme performansı.' : '400% faster and more permanent learning performance compared to traditional methods by playing only 10 minutes a day.'}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-400 mt-1">✓</span>
                        <span><strong className="text-white">{language === 'TR' ? 'Maksimum Odaklanma:' : 'Maximum Focus:'}</strong> {language === 'TR' ? 'Sıkıcı flashcard\'lar yerine, adeta 90\'ların atari salonlarındaki o yüksek odaklanmayı sağlayan bilimsel algoritmalar.' : 'Scientific algorithms that provide that high focus almost like in the 90s arcade halls instead of boring flashcards.'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-900/80 border border-emerald-500/30 rounded-xl p-4 mt-8 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <h3 className="text-xs font-black text-emerald-400 tracking-widest uppercase mb-2">
                      {language === 'TR' ? 'İletişim & İş Birliği' : 'Contact & Collaboration'}
                    </h3>
                    <p className="text-[11px] text-gray-400 mb-3">
                      {language === 'TR' ? 'Sistem mimarimiz, bilişsel algoritmalarımız hakkında teknik sorularınız varsa, kurumsal iş birlikleri veya sadece geri bildirimde bulunmak isterseniz bizimle her zaman iletişime geçebilirsiniz.' : 'If you have technical questions about our system architecture, cognitive algorithms, corporate collaborations, or just want to provide feedback, you can always contact us.'}
                    </p>
                    <div className="flex flex-col items-center gap-1.5 text-xs">
                      <a href="mailto:info@memolandum.com" className="text-cyan-400 font-bold hover:text-white transition-colors">info@memolandum.com</a>
                      <span className="text-gray-500">{language === 'TR' ? 'Merkez / Ofis: Ankara, Türkiye' : 'HQ / Office: Ankara, Turkey'}</span>
                      <div className="flex gap-4 mt-2">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">X (Twitter)</a>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-[10px] text-gray-500 italic">
                      {language === 'TR' ? '"Geleceğin öğrenme teknolojisini, bilişimin sıfır noktası olan retro ruhuyla inşa ediyoruz."' : '"We build the learning technology of the future with the retro spirit, the ground zero of computing."'}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}
