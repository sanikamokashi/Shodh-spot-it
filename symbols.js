// The 57 Shodh symbols: English name, category, Marathi/Hindi names and meaning.
// Used by the website (app.js) and the printable symbol guide (guide.html).
// Images: images/symbols/<id>.png (resized from source-art/symbols-originals.zip).
// Categories: divine, ritual, festival, food, play, nation.
(function () {
  /* ---------- Data ----------
     names: one entry when Marathi and Hindi agree ('both'),
            otherwise separate 'mr' and 'hi' entries. tr = transliteration. */
  const B = (dev, tr) => [{ lang: 'both', dev, tr }];
  const MH = (mr, mrTr, hi, hiTr) => [{ lang: 'mr', dev: mr, tr: mrTr }, { lang: 'hi', dev: hi, tr: hiTr }];

  window.SHODH_SYMBOLS = [
    // Gods and goddesses
    { id: 'ganesha', name: 'Ganesha', cat: 'divine', names: MH('गणपती', 'Ganpati', 'गणेश', 'Ganesh'), text: 'God of wisdom and knowledge. We pray to him before starting anything new because he helps clear away obstacles in our path.' },
    { id: 'saraswati', name: 'Saraswati', cat: 'divine', names: B('सरस्वती', 'Saraswati'), text: 'Goddess of learning, music, and art. Holding her Veena, she inspires students, artists, and musicians to be creative and practice their skills.' },
    { id: 'shivalinga', name: 'Shivalinga', cat: 'divine', names: B('शिवलिंग', 'Shivling'), text: 'A smooth, rounded stone representing Lord Shiva, symbolizing the infinite, formless origin of the universe and the power of divine creation.' },
    { id: 'krishna', name: 'Krishna', cat: 'divine', names: B('कृष्ण', 'Krishna'), text: 'This playful and wise god is celebrated for his fun childhood adventures and the advice he shared in the Bhagavad Gita about right and wrong.' },
    { id: 'rama', name: 'Rama', cat: 'divine', names: B('राम', 'Ram'), text: 'An avatar of Vishnu from the epic Ramayana. He is celebrated as the perfect example of always doing the right thing and living an honorable life.' },
    { id: 'lakshmi', name: 'Lakshmi', cat: 'divine', names: B('लक्ष्मी', 'Lakshmi'), text: 'The Hindu goddess of wealth, prosperity, and fortune, who symbolizes both material and spiritual abundance.' },

    // Rituals and worship
    { id: 'batu', name: 'Batu (Munja boy)', cat: 'ritual', names: B('बटू', 'Batu'), text: 'Munja marks the special day he steps into student life, making a promise to stay curious, work hard, and focus on his studies.' },
    { id: 'yantra', name: 'Saraswati Yantra', cat: 'ritual', names: B('सरस्वती यंत्र', 'Saraswati yantra'), text: 'A sacred geometric diagram used as a meditative tool to focus the mind and invoke the blessings of Goddess Saraswati.' },
    { id: 'om', name: 'Om', cat: 'ritual', names: B('ॐ', 'Om'), text: 'The most famous sacred sound and symbol. Chanting “Om” creates a soothing vibration that helps calm the body and quiet a busy mind.' },
    { id: 'agni', name: 'Agni', cat: 'ritual', names: MH('अग्नी', 'Agni', 'अग्नि', 'Agni'), text: 'The sacred fire that acts as a divine messenger. It carries our offerings and prayers to the gods while also purifying the environment around it.' },
    { id: 'kalash', name: 'Kalash', cat: 'ritual', names: B('कलश', 'Kalash'), text: 'A sacred metal pot filled with water, topped with mango leaves and a coconut. It represents the source of all life and abundance.' },
    { id: 'samai', name: 'Samai / Niranjan', cat: 'ritual', names: MH('समई', 'Samai', 'दीया', 'Diya'), text: 'A traditional lamp lit in front of the gods. The flame symbolizes removing darkness and lighting up our minds with divine knowledge.' },
    { id: 'ghanti', name: 'Ghanti', cat: 'ritual', names: B('घंटी', 'Ghanti'), text: 'A ritual brass bell rung during worship to produce an auspicious sound that focuses the mind and drives away negative energies.' },
    { id: 'haldi-kumkum', name: 'Haldi Kumkum', cat: 'ritual', names: MH('हळद-कुंकू', 'Halad-kunku', 'हल्दी-कुमकुम', 'Haldi-kumkum'), text: 'Haldi (turmeric) and kumkum (vermilion) are traditional powders used in Hindu rituals to symbolize auspiciousness and good fortune.' },
    { id: 'toran', name: 'Toran', cat: 'ritual', names: B('तोरण', 'Toran'), text: 'A decorative garland of marigold flowers and mango leaves, hung across doorways to welcome prosperity and positivity into the house.' },
    { id: 'jaswand', name: 'Hibiscus', cat: 'ritual', names: MH('जास्वंद', 'Jaswand', 'गुड़हल', 'Gudhal'), text: 'A bright red flower that is deeply respected in Hindu worship and is known as Lord Ganesha’s favorite flower.' },

    // India and history
    { id: 'shivaji', name: 'Shivaji Maharaj', cat: 'nation', names: B('शिवाजी महाराज', 'Shivaji Maharaj'), text: 'A visionary 17th-century Maratha king and brilliant military leader who founded the Maratha Empire.' },
    { id: 'killa', name: 'Fort', cat: 'nation', names: MH('किल्ला', 'Killa', 'किला', 'Kila'), text: 'A historic hilltop stronghold, famously used by Chhatrapati Shivaji Maharaj as a strategic military outpost.' },
    { id: 'tiranga', name: 'Indian flag', cat: 'nation', names: B('तिरंगा', 'Tiranga'), text: 'The national flag of India, featuring its three famous colors (saffron, white, and green) and the blue Ashoka chakra.' },
    { id: 'balloons', name: 'Tricolor balloons', cat: 'nation', names: MH('तिरंगी फुगे', 'Tirangi fuge', 'तिरंगे गुब्बारे', 'Tirange gubbare'), text: 'Balloons matching the three colors of the Indian flag.' },
    { id: 'india-map', name: 'India map', cat: 'nation', names: MH('भारताचा नकाशा', 'Bharatacha nakasha', 'भारत का नक्शा', 'Bharat ka naksha'), text: 'The geographical map showing the shape of India.' },
    { id: 'rupee', name: 'Rupee symbol', cat: 'nation', names: B('रुपया', 'Rupaya'), text: 'The official symbol used for India’s currency.' },
    { id: 'kamal', name: 'Lotus', cat: 'nation', names: MH('कमळ', 'Kamal', 'कमल', 'Kamal'), text: 'The national flower of India. It symbolizes purity, divine beauty, and spiritual enlightenment.' },
    { id: 'namaste', name: 'Namaste', cat: 'nation', names: MH('नमस्कार', 'Namaskar', 'नमस्ते', 'Namaste'), text: 'A respectful hand gesture used to greet others and show respect.' },
    { id: 'gateway', name: 'Gateway of India', cat: 'nation', names: B('गेटवे ऑफ इंडिया', 'Gateway of India'), text: 'A grand stone arch on the Mumbai waterfront, built in 1924 to welcome visitors arriving by sea.' },
    { id: 'taj-mahal', name: 'Taj Mahal', cat: 'nation', names: MH('ताजमहाल', 'Tajmahal', 'ताजमहल', 'Tajmahal'), text: 'A white marble monument in Agra, built by Emperor Shah Jahan in memory of his wife. It is one of the wonders of the world.' },
    { id: 'rickshaw', name: 'Auto rickshaw', cat: 'nation', names: MH('रिक्षा', 'Riksha', 'ऑटो रिक्शा', 'Auto riksha'), text: 'The three-wheeled taxi buzzing through every Indian city and town.' },
    { id: 'peacock', name: 'Peacock', cat: 'nation', names: B('मोर', 'Mor'), text: 'India’s national bird, famous for its shimmering blue-green feathers and its dance when the rains arrive.' },
    { id: 'tiger', name: 'Tiger', cat: 'nation', names: MH('वाघ', 'Vagh', 'बाघ', 'Bagh'), text: 'The Bengal tiger, India’s national animal and a symbol of strength and courage.' },
    { id: 'cow', name: 'Cow (Gaumata)', cat: 'nation', names: MH('गाय', 'Gaay', 'गाय', 'Gaay'), text: 'Honoured as Gaumata, “mother cow”, for the milk she gives. Cows are cared for in many homes and temples.' },

    // Festivals
    { id: 'gudi-padva', name: 'Gudi Padva', cat: 'festival', names: MH('गुढीपाडवा', 'Gudhi Padva', 'गुड़ी पड़वा', 'Gudi Padva'), text: 'The Marathi New Year. Families raise a gudi, a pole dressed with silk cloth, neem leaves, flowers and an upturned pot, outside their homes.' },
    { id: 'diya', name: 'Diwali diya', cat: 'festival', names: MH('पणती', 'Panati', 'दीया', 'Diya'), text: 'Small clay lamps lit in rows during Diwali, the festival of lights, to welcome Lakshmi and chase away the darkness.' },
    { id: 'kandil', name: 'Diwali lantern', cat: 'festival', names: MH('आकाशकंदील', 'Akashkandil', 'कंदील', 'Kandeel'), text: 'A star-shaped paper lantern hung outside homes during Diwali.' },
    { id: 'rocket', name: 'Diwali rocket', cat: 'festival', names: B('रॉकेट', 'Rocket'), text: 'Fireworks that whoosh up and light the night sky during Diwali celebrations.' },
    { id: 'rangoli', name: 'Diwali rangoli', cat: 'festival', names: MH('रांगोळी', 'Rangoli', 'रंगोली', 'Rangoli'), text: 'Bright patterns made with coloured powder at the doorstep during Diwali, to welcome guests and good luck.' },
    { id: 'kolam', name: 'Kolam', cat: 'festival', names: B('कोलम', 'Kolam'), text: 'A pattern of dots and looping lines drawn outside homes each morning, often with rice flour. The patterns on this website are kolams!' },
    { id: 'rakhi', name: 'Rakhi', cat: 'festival', names: B('राखी', 'Rakhi'), text: 'On Raksha Bandhan, a sister ties a decorated thread on her brother’s wrist to celebrate their bond, and he promises to look after her.' },
    { id: 'kite', name: 'Kite', cat: 'festival', names: B('पतंग', 'Patang'), text: 'Kites fill the sky on Makar Sankranti, as friends try to cut each other’s strings.' },
    { id: 'dahi-handi', name: 'Dahi Handi', cat: 'festival', names: MH('दहीहंडी', 'Dahihandi', 'दही हांडी', 'Dahi handi'), text: 'On Gokulashtami, teams build human pyramids to break a pot of curd hung high above the street, just as young Krishna stole butter.' },
    { id: 'shankh', name: 'Shankh', cat: 'ritual', names: B('शंख', 'Shankh'), text: 'A conch shell blown at the start of prayers and celebrations. Its sound is considered pure and auspicious.' },

    // Food
    { id: 'mango', name: 'Mango', cat: 'food', names: MH('आंबा', 'Amba', 'आम', 'Aam'), text: 'The king of fruits. Summer in India means sweet, juicy mangoes, and Maharashtra’s Hapus (Alphonso) is famous around the world.' },
    { id: 'coconut', name: 'Coconut', cat: 'food', names: MH('नारळ', 'Naral', 'नारियल', 'Nariyal'), text: 'Offered in temples and broken for luck before starting something new. Its water, flesh and oil are used in everyday cooking.' },
    { id: 'ladoo', name: 'Ladoo', cat: 'food', names: MH('लाडू', 'Ladu', 'लड्डू', 'Laddu'), text: 'A round sweet made with besan, rava or coconut, ghee and sugar, shared at festivals and happy occasions.' },
    { id: 'chili', name: 'Chili', cat: 'food', names: B('मिरची', 'Mirchi'), text: 'Green and red chilies give Indian food its famous spice and heat.' },
    { id: 'dosa', name: 'Dosa', cat: 'food', names: B('डोसा', 'Dosa'), text: 'A thin, crispy pancake from South India made from a rice and lentil batter, served with chutney and sambar.' },
    { id: 'idli', name: 'Idli', cat: 'food', names: B('इडली', 'Idli'), text: 'Soft, steamed rice and lentil cakes from South India: a light, healthy breakfast.' },
    { id: 'jalebi', name: 'Jalebi', cat: 'food', names: MH('जिलेबी', 'Jilebi', 'जलेबी', 'Jalebi'), text: 'Crisp orange spirals of fried batter soaked in sugar syrup, a favourite sweet at festivals.' },
    { id: 'chai', name: 'Chai', cat: 'food', names: MH('चहा', 'Chaha', 'चाय', 'Chai'), text: 'Milky tea brewed with ginger, cardamom and sugar. Many Indian homes start the day with a cup.' },

    // Games and music
    { id: 'chess', name: 'Chess', cat: 'play', names: MH('बुद्धिबळ', 'Buddhibal', 'शतरंज', 'Shatranj'), text: 'The game of strategy began in India as “chaturanga” more than 1,500 years ago.' },
    { id: 'cricket', name: 'Cricket', cat: 'play', names: B('क्रिकेट', 'Cricket'), text: 'India’s most loved sport, played everywhere from big stadiums to narrow lanes.' },
    { id: 'season-ball', name: 'Season ball', cat: 'play', names: B('सीझन बॉल', 'Season ball'), text: 'The hard leather cricket ball used for proper matches, instead of the tennis ball used in street games.' },
    { id: 'carrom', name: 'Carrom', cat: 'play', names: MH('कॅरम', 'Carrom', 'कैरम', 'Carrom'), text: 'A tabletop game where players flick a striker to pocket wooden coins. A family favourite on lazy afternoons.' },
    { id: 'badminton', name: 'Badminton', cat: 'play', names: MH('बॅडमिंटन', 'Badminton', 'बैडमिंटन', 'Badminton'), text: 'A fast racket sport played with a shuttlecock. Its modern rules took shape in Pune in the 1870s.' },
    { id: 'hockey', name: 'Hockey', cat: 'play', names: B('हॉकी', 'Hockey'), text: 'Field hockey, in which India has won eight Olympic gold medals.' },
    { id: 'tabla', name: 'Tabla', cat: 'play', names: B('तबला', 'Tabla'), text: 'A pair of hand drums at the heart of Indian classical and devotional music.' },
    { id: 'sitar', name: 'Sitar', cat: 'play', names: MH('सतार', 'Satar', 'सितार', 'Sitar'), text: 'A long-necked string instrument with a rich, ringing sound, made famous around the world by Pandit Ravi Shankar.' },
    { id: 'flute', name: 'Flute', cat: 'play', names: MH('बासरी', 'Basari', 'बाँसुरी', 'Bansuri'), text: 'A simple bamboo flute, the instrument Krishna is always shown playing.' },
  ];
})();
