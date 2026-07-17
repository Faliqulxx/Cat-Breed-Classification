import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Image as ImageIcon, Loader2, Info, ChevronRight, BarChart3, Settings2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://127.0.0.1:8000';

const CAT_BREEDS_INFO = [
  { id: "abyssinian", name: "Abyssinian", desc: "Diyakini berasal dari pesisir Samudra Hindia atau Mesir Kuno. Mitosnya, ras ini merupakan keturunan langsung dari kucing suci yang dipuja oleh para Firaun.", emoji: "🐈", image: "/cat_breeds/Abyssinian.jpg" },
  { id: "bengal", name: "Bengal", desc: "Berawal di Amerika Serikat dari persilangan unik antara kucing domestik dengan macan tutul Asia (Prionailurus bengalensis).", emoji: "🐈", image: "/cat_breeds/Bengal.jpg" },
  { id: "birman", name: "Birman", desc: "Dikenal sebagai 'Kucing Suci Burma'. Legenda menceritakan mata biru safir mereka adalah anugerah dewi berkat kesetiaannya menjaga pendeta.", emoji: "🐈", image: "/cat_breeds/Birman.jpg" },
  { id: "bombay", name: "Bombay", desc: "Ras buatan Amerika Serikat (1950-an) yang sengaja dikembangkan agar menyerupai miniatur macan kumbang hitam liar eksotis dari India.", emoji: "🐈‍⬛", image: "/cat_breeds/Bombay.jpg" },
  { id: "british_shorthair", name: "British Shorthair", desc: "Ras kuno keturunan kucing Roma yang dibawa ke Inggris 2.000 tahun lalu. Konon menjadi inspirasi karakter magis Cheshire Cat dalam Alice in Wonderland.", emoji: "🐈", image: "/cat_breeds/British_Shorthair.jpg" },
  { id: "egyptian_mau", name: "Egyptian Mau", desc: "Ras Mesir ini sangat mirip dengan penggambaran kucing yang disembah orang Mesir Kuno. Kata 'Mau' sendiri berarti 'kucing' dalam bahasa Mesir kuno.", emoji: "🐈‍⬛", image: "/cat_breeds/Egyptian_Mau.jpg" },
  { id: "maine_coon", name: "Maine Coon", desc: "Kucing asli Amerika Utara. Terdapat mitos populer (meski secara genetik mustahil) yang menyebutkan bahwa ras ini adalah hasil persilangan dengan rakun.", emoji: "🐈", image: "/cat_breeds/Maine_Coon.jpg" },
  { id: "persian", name: "Persian", desc: "Ras berdarah biru yang berasal dari Mesopotamia (kini Iran). Dulunya merupakan lambang kemewahan bangsawan Eropa dan primadona di istana Ratu Victoria.", emoji: "🐈", image: "/cat_breeds/Persian.jpg" },
  { id: "ragdoll", name: "Ragdoll", desc: "Dikembangkan di AS pada 1960-an. Sempat beredar mitos aneh bahwa mereka tak bisa merasakan sakit karena sifatnya yang begitu pasrah bak boneka kain.", emoji: "🐈‍⬛", image: "/cat_breeds/Ragdoll.jpg" },
  { id: "russian_blue", name: "Russian Blue", desc: "Berasal dari wilayah Arkhangelsk, Rusia. Menurut cerita rakyat Rusia setempat, kucing berbulu perak ini adalah peliharaan Tsar yang diyakini membawa keberuntungan.", emoji: "🐈", image: "/cat_breeds/Russian_Blue.jpg" },
  { id: "siamese", name: "Siamese", desc: "Kucing sakral Kerajaan Siam (Thailand). Mitos kuno Siam memercayai bahwa roh para bangsawan yang meninggal akan bereinkarnasi ke dalam tubuh kucing ini.", emoji: "🐈‍⬛", image: "/cat_breeds/Siamese.jpg" },
  { id: "sphynx", name: "Sphynx", desc: "Meski namanya lekat dengan mitologi Mesir, ras ini nyatanya berawal dari mutasi genetik alami di Kanada (1966) yang membuatnya tidak memiliki bulu.", emoji: "🐈‍⬛", image: "/cat_breeds/Sphynx.jpg" }
];

function App() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('MobileNetV2');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/models`)
      .then(res => {
        if (res.data.models) {
          // Sort models based on accuracy order: MobileNetV2, CNN Scratch, ResNet50
          const order = ["MobileNetV2", "CNN Scratch", "ResNet50"];
          const sortedModels = res.data.models.sort((a, b) => {
            const indexA = order.indexOf(a) !== -1 ? order.indexOf(a) : 99;
            const indexB = order.indexOf(b) !== -1 ? order.indexOf(b) : 99;
            return indexA - indexB;
          });
          setModels(sortedModels);
        }
      })
      .catch(err => {
        console.error("Failed to fetch models", err);
        setModels(["MobileNetV2", "CNN Scratch", "ResNet50"]);
      });
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', selectedModel);

    try {
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setResult(res.data);
      }
    } catch (err) {
      setError("Gagal menghubungi server. Pastikan backend sudah berjalan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBreedInfo = (breedId) => {
    return CAT_BREEDS_INFO.find(b => b.id === breedId) || { name: breedId, desc: "Deskripsi belum tersedia.", emoji: "🐱" };
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] text-stone-800 font-sans selection:bg-orange-200">

      {/* Playful Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-200/50 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-200/50 blur-[100px]" />
        {/* Subtle decorative paw prints using text */}
        <div className="absolute top-20 left-20 text-4xl opacity-10 rotate-12">🐾</div>
        <div className="absolute bottom-40 left-32 text-6xl opacity-10 -rotate-12">🐾</div>
        <div className="absolute top-40 right-32 text-5xl opacity-10 rotate-45">🐾</div>
        <div className="absolute bottom-20 right-20 text-3xl opacity-10 -rotate-45">🐾</div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-14 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center p-4 bg-white rounded-3xl mb-2 shadow-xl shadow-orange-100 border-4 border-orange-100"
          >
            <span className="text-5xl">😻</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight text-stone-800"
          >
            Neko<span className="text-orange-500">Vision</span> AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-stone-600 max-w-2xl mx-auto font-medium"
          >
            Cari tahu ras kucing kesayanganmu! Unggah foto kucing, dan biarkan AI kami mengenalinya dari 12 ras populer di dunia.
          </motion.p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column - Controls & Upload */}
          <div className="lg:col-span-5 space-y-6">

            {/* Upload Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                  <ImageIcon size={24} />
                </div>
                <h2 className="text-xl font-bold text-stone-800">Pilih Foto Kucing</h2>
              </div>

              <label className="block group cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className={`relative flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-[1.5rem] transition-all duration-300 ${preview ? 'border-orange-300 bg-orange-50/50' : 'border-stone-200 hover:border-orange-400 hover:bg-orange-50'}`}>
                  {preview ? (
                    <div className="relative w-full aspect-square max-h-64 rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-orange-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <p className="text-white font-bold flex items-center gap-2"><UploadCloud size={20} /> Ganti Foto</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm text-orange-500">
                        <UploadCloud size={36} />
                      </div>
                      <p className="text-center font-bold text-stone-700 mb-1 text-lg">Klik untuk unggah</p>
                      <p className="text-sm text-stone-500 text-center font-medium">Atau seret foto ke sini (JPG, PNG)</p>
                    </>
                  )}
                </div>
              </label>

              <button
                onClick={handlePredict}
                disabled={!file || loading}
                className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center transition-all duration-300 ${!file ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-1'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-3" /> Menganalisis Ciri...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2" size={20} fill="currentColor" /> Temukan Rasnya
                  </>
                )}
              </button>
            </motion.div>

            {/* Model Selection Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 backdrop-blur-xl border border-stone-100 rounded-3xl p-6 shadow-xl shadow-stone-200/40"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Settings2 className="text-stone-400" size={20} />
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Otak AI (Model)</h3>
              </div>

              <div className="space-y-2">
                {models.map(m => (
                  <label key={m} className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedModel === m ? 'bg-white border-orange-400 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50'}`}>
                    <input
                      type="radio"
                      name="model"
                      value={m}
                      checked={selectedModel === m}
                      onChange={() => setSelectedModel(m)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selectedModel === m ? 'border-orange-500' : 'border-stone-300'}`}>
                      {selectedModel === m && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`font-semibold ${selectedModel === m ? 'text-stone-800' : 'text-stone-600'}`}>{m}</span>
                      {m === "MobileNetV2" && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold">Terbaik ⭐</span>}
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!result && !error && !loading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-10 bg-white/40 backdrop-blur-md border-4 border-dashed border-stone-200 rounded-[3rem]"
                >
                  <div className="text-7xl mb-6 opacity-80 filter grayscale opacity-30">🐈</div>
                  <h3 className="text-2xl font-bold text-stone-400 mb-2">Area Hasil Analisis</h3>
                  <p className="text-stone-500 text-center max-w-sm font-medium">Unggah foto anabul favoritmu untuk mengetahui kemiripan rasnya.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-10 bg-white rounded-[3rem] shadow-2xl shadow-orange-100"
                >
                  <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 rounded-full border-8 border-orange-100"></div>
                    <div className="absolute inset-0 rounded-full border-8 border-orange-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">🔍</div>
                  </div>
                  <h3 className="text-2xl font-bold text-stone-700">Menganalisis Pola Bulu...</h3>
                  <p className="text-stone-500 mt-2">Mencocokkan dengan 12 database ras</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-500 text-4xl">😿</span>
                  </div>
                  <h3 className="text-2xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h3>
                  <p className="text-red-600 font-medium">{error}</p>
                </motion.div>
              )}

              {result && !loading && (() => {
                const topBreed = getBreedInfo(result.prediction);
                return (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Top Result Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-orange-100 relative overflow-hidden border border-orange-50">
                      <div className="absolute -top-10 -right-10 text-[15rem] opacity-5 pointer-events-none rotate-12">
                        {topBreed.emoji}
                      </div>

                      <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold text-sm mb-6">
                          <span>✨</span> Analisis Selesai
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
                          <div className="flex-1">
                            <p className="text-stone-500 font-bold uppercase tracking-wider text-sm mb-2">Kucing ini kemungkinan adalah:</p>
                            <h2 className="text-4xl md:text-6xl font-black text-stone-800 tracking-tight">
                              {topBreed.name} <span className="text-orange-500">{topBreed.emoji}</span>
                            </h2>
                          </div>

                          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white text-center shadow-lg shadow-orange-200 shrink-0">
                            <div className="text-sm font-semibold opacity-90 mb-1">Tingkat Kemiripan</div>
                            <div className="text-4xl font-black">{(result.confidence * 100).toFixed(1)}%</div>
                          </div>
                        </div>

                        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                          <h4 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                            <Info size={18} /> Sekilas tentang {topBreed.name}
                          </h4>
                          <p className="text-orange-900/80 font-medium leading-relaxed">
                            {topBreed.desc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Probability Chart Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200/50 border border-stone-100">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-stone-100 rounded-xl text-stone-600">
                          <BarChart3 size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-stone-800">Kemungkinan Ras Lainnya</h3>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(result.probabilities)
                          .slice(1, 4) // Tampilkan urutan ke 2 sampai 4
                          .map(([breed, prob], index) => {
                            const info = getBreedInfo(breed);
                            return (
                              <div key={breed} className="relative">
                                <div className="flex justify-between mb-2">
                                  <span className="font-bold text-stone-600 flex items-center gap-2">
                                    {info.emoji} {info.name}
                                  </span>
                                  <span className="font-bold text-stone-400">{(prob * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${prob * 100}%` }}
                                    transition={{ duration: 1, delay: 0.1 * index }}
                                    className="h-full rounded-full bg-stone-300"
                                  />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>

        {/* 12 Cat Breeds Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-stone-800 mb-4">Mengenal 12 Ras Kucing NekoVision</h2>
            <p className="text-stone-600 font-medium max-w-2xl mx-auto">Sistem AI kami dilatih khusus untuk dapat membedakan pola fisik, bentuk wajah, dan jenis bulu dari 12 ras kucing paling populer di dunia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CAT_BREEDS_INFO.map(breed => (
              <div key={breed.id} className="bg-white rounded-[2rem] p-5 shadow-lg shadow-stone-200/50 border border-stone-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group overflow-hidden">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 cursor-pointer">
                  <img src={breed.image} alt={breed.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold shadow-sm z-10">
                    {breed.emoji}
                  </div>
                  {/* Overlay Description */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-5 z-20">
                    <p className="text-white text-sm font-medium text-center leading-relaxed">
                      {breed.desc}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-stone-800 text-center">{breed.name}</h3>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
