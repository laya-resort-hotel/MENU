(() => {
  const APP_VERSION = '1.0.0';
  const KEYS = {
    meta: 'taste_demo_meta',
    categories: 'taste_demo_categories',
    items: 'taste_demo_items',
    users: 'taste_demo_users',
    settings: 'taste_demo_settings',
    orders: 'taste_demo_orders',
    session: 'taste_demo_session'
  };

  const LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'zh', label: '中文' },
    { code: 'ru', label: 'Русский' }
  ];

  const PAGE = document.body.dataset.page;
  let toastTimer = null;
  let audioUnlocked = false;
  let boardBeepInterval = null;

  const seedCategories = [
    { id: 'all', code: 'all', name_en: 'All', name_zh: '全部', name_ru: 'Все', sortOrder: 0, isActive: true },
    { id: 'appetizer', code: 'appetizer', name_en: 'Appetizer', name_zh: '前菜', name_ru: 'Закуска', sortOrder: 1, isActive: true },
    { id: 'soup', code: 'soup', name_en: 'Soup', name_zh: '汤', name_ru: 'Суп', sortOrder: 2, isActive: true },
    { id: 'thai', code: 'thai', name_en: 'Thai Favorites', name_zh: '泰式主菜', name_ru: 'Тайские блюда', sortOrder: 3, isActive: true },
    { id: 'western', code: 'western', name_en: 'Western & Noodles', name_zh: '西式与面食', name_ru: 'Западные блюда и лапша', sortOrder: 4, isActive: true },
    { id: 'pasta', code: 'pasta', name_en: 'Pasta', name_zh: '意面', name_ru: 'Паста', sortOrder: 5, isActive: true },
    { id: 'dessert', code: 'dessert', name_en: 'Dessert', name_zh: '甜点', name_ru: 'Десерт', sortOrder: 6, isActive: true },
    { id: 'kids', code: 'kids', name_en: 'Kid Menu', name_zh: '儿童菜单', name_ru: 'Детское меню', sortOrder: 7, isActive: true }
  ];

  const seedItems = [
    { id:'spring-rolls', categoryId:'appetizer', price:220, sortOrder:1, imageLabel:'SR', isActive:true, soldOut:false, hidden:false,
      name_en:'Deep-Fried Spring Rolls', desc_en:'House-made spring rolls, served with plum sauce.',
      name_zh:'炸春卷', desc_zh:'手工春卷，配梅子酱。',
      name_ru:'Весенние роллы', desc_ru:'Домашние спринг-роллы, подаются со сливовым соусом.', tags:['starter'] },
    { id:'goong-sa-rong', categoryId:'appetizer', price:300, sortOrder:2, imageLabel:'GS', isActive:true, soldOut:false, hidden:false,
      name_en:'Goong Sa-Rong', desc_en:'Thai-style deep-fried shrimp wrapped in vermicelli noodles.',
      name_zh:'金丝虾', desc_zh:'泰式粉丝裹虾（油炸）。',
      name_ru:'Гунг Са-Ронг', desc_ru:'Креветки, обжаренные во фритюре по-тайски и завернутые в вермишель.', tags:['seafood'] },
    { id:'thai-seafood-salad', categoryId:'appetizer', price:350, sortOrder:3, imageLabel:'TS', isActive:true, soldOut:false, hidden:false,
      name_en:'Thai Seafood Salad', desc_en:'Glass noodle salad with prawns, squids, mussels, lime, chili and coriander.',
      name_zh:'泰式海鲜沙拉', desc_zh:'凉拌粉丝配虾、鱿鱼、贻贝、青柠、辣椒和香菜。',
      name_ru:'Тайский салат с морепродуктами', desc_ru:'Салат из стеклянной лапши с креветками, кальмарами, мидиями, лаймом, чили и кинзой.', tags:['seafood','spicy'] },
    { id:'thai-beef-salad', categoryId:'appetizer', price:320, sortOrder:4, imageLabel:'TB', isActive:true, soldOut:false, hidden:false,
      name_en:'Thai Beef Salad', desc_en:'Roasted beef salad with chili, coriander, onion and glass noodles in a lime dressing.',
      name_zh:'泰式牛肉沙拉', desc_zh:'青柠汁拌烤牛肉沙拉，配辣椒、香菜、洋葱和粉丝。',
      name_ru:'Тайский салат с говядиной', desc_ru:'Салат из жареной говядины с чили, кинзой, луком и стеклянной лапшой в лаймовой заправке.', tags:['beef','spicy'] },
    { id:'satay-chicken', categoryId:'appetizer', price:220, sortOrder:5, imageLabel:'SC', isActive:true, soldOut:false, hidden:false,
      name_en:'Satay Chicken', desc_en:'Served with peanut sauce and cucumber relish.',
      name_zh:'沙嗲鸡肉', desc_zh:'配花生酱和黄瓜沙拉。',
      name_ru:'Сатай Курица', desc_ru:'Подается с арахисовым соусом и огуречным ассорти.', tags:['chicken','nuts'] },
    { id:'satay-beef', categoryId:'appetizer', price:240, sortOrder:6, imageLabel:'SB', isActive:true, soldOut:false, hidden:false,
      name_en:'Satay Beef', desc_en:'Served with peanut sauce and cucumber relish.',
      name_zh:'沙嗲牛肉', desc_zh:'配花生酱和黄瓜沙拉。',
      name_ru:'Сатай Говядина', desc_ru:'Подается с арахисовым соусом и огуречным ассорти.', tags:['beef','nuts'] },

    { id:'tom-yum-goong', categoryId:'soup', price:350, sortOrder:1, imageLabel:'TY', isActive:true, soldOut:false, hidden:false,
      name_en:'Tom Yum Goong', desc_en:'Traditional Thai hot & sour prawn soup with lemongrass, served with steamed rice.',
      name_zh:'冬阴功虾汤', desc_zh:'经典传统泰式酸辣虾汤，加入香茅，佐以白米饭。',
      name_ru:'Том Ям Гунг', desc_ru:'Традиционный тайский кисло-острый суп с креветками и лемонграссом, подается с отварным рисом.', tags:['soup','seafood','spicy'] },
    { id:'tom-kha-gai', categoryId:'soup', price:250, sortOrder:2, imageLabel:'TK', isActive:true, soldOut:false, hidden:false,
      name_en:'Tom Kha Gai', desc_en:'Galangal-coconut broth with chicken, coriander and kaffir lime leaf, served with steamed rice.',
      name_zh:'椰奶鸡汤', desc_zh:'香浓高良姜椰奶鸡汤，加入香菜与卡菲尔酸橙叶，搭配白米饭。',
      name_ru:'Том Кха Гай', desc_ru:'Бульон из галангала и кокоса, курица, кинза, листья кафрского лайма, подается с отварным рисом.', tags:['soup','chicken'] },
    { id:'clear-soup', categoryId:'soup', price:220, sortOrder:3, imageLabel:'CS', isActive:true, soldOut:false, hidden:false,
      name_en:'Clear Soup with Pork Mince or Chicken Mince', desc_en:'Egg tofu, Chinese cabbage and spring onion.',
      name_zh:'清汤配猪肉末或鸡肉末', desc_zh:'鸡蛋豆腐配白菜和葱。',
      name_ru:'Прозрачный суп со свининой или курицей', desc_ru:'Яичный тофу, китайская капуста, зеленый лук.', tags:['soup'] },
    { id:'french-onion-soup', categoryId:'soup', price:220, sortOrder:4, imageLabel:'FO', isActive:true, soldOut:false, hidden:false,
      name_en:'French Onion Soup', desc_en:'Classic onion soup, served with cheese crouton.',
      name_zh:'经典法式洋葱汤', desc_zh:'经典洋葱汤，配芝士面包丁。',
      name_ru:'Французский луковый суп', desc_ru:'Классический луковый суп, подается с сырными гренками.', tags:['soup'] },
    { id:'cream-mushroom-soup', categoryId:'soup', price:220, sortOrder:5, imageLabel:'CM', isActive:true, soldOut:false, hidden:false,
      name_en:'Cream of Mushroom Soup', desc_en:'Mixed mushroom cream soup with garlic crouton.',
      name_zh:'奶油蘑菇汤', desc_zh:'浓郁什锦蘑菇奶油汤，佐以蒜香烤面包丁。',
      name_ru:'Крем-суп из грибов', desc_ru:'Грибной крем-суп с чесночными гренками.', tags:['soup'] },
    { id:'cream-tomato-soup', categoryId:'soup', price:220, sortOrder:6, imageLabel:'CT', isActive:true, soldOut:false, hidden:false,
      name_en:'Cream of Tomato Soup', desc_en:'Creamy tomato soup, served with garlic crouton.',
      name_zh:'番茄奶油浓汤', desc_zh:'奶油番茄汤，配蒜香面包丁。',
      name_ru:'Крем-суп из томатов', desc_ru:'Сливочный томатный суп, подается с чесночными гренками.', tags:['soup'] },

    { id:'massaman-nue', categoryId:'thai', price:350, sortOrder:1, imageLabel:'MN', isActive:true, soldOut:false, hidden:false,
      name_en:'Massaman Nue', desc_en:'Traditional Massaman beef curry.',
      name_zh:'马沙曼牛肉咖喱', desc_zh:'传统马沙曼牛肉咖喱。',
      name_ru:'Говядина Массаман', desc_ru:'Традиционное карри из говядины по-массамански.', tags:['beef','curry'] },
    { id:'gang-phed-ped-yang', categoryId:'thai', price:350, sortOrder:2, imageLabel:'RD', isActive:true, soldOut:false, hidden:false,
      name_en:'Gang Phed Ped Yang', desc_en:'Red curry with roasted duck and fruits.',
      name_zh:'红咖喱烤鸭', desc_zh:'泰式红咖喱烤鸭佐水果。',
      name_ru:'Ганг Пхед Пед Ян', desc_ru:'Красное карри с жареной уткой и фруктами.', tags:['duck','curry'] },
    { id:'seabass-yellow-curry', categoryId:'thai', price:400, sortOrder:3, imageLabel:'SY', isActive:true, soldOut:false, hidden:false,
      name_en:'Seabass on Yellow Curry Sauce', desc_en:'Fried seabass with yellow curry sauce.',
      name_zh:'泰式黄咖喱海鲈鱼', desc_zh:'泰式黄咖喱酱炸海鲈鱼。',
      name_ru:'Морской окунь в соусе карри', desc_ru:'Жареный морской окунь с соусом карри.', tags:['seafood','curry'] },
    { id:'panang-chicken-curry', categoryId:'thai', price:300, sortOrder:4, imageLabel:'PC', isActive:true, soldOut:false, hidden:false,
      name_en:'Panang Chicken Curry', desc_en:'Mildly spiced Panang curry with fragrant herbs.',
      name_zh:'泰式帕南鸡肉咖喱', desc_zh:'香草点缀的微辣帕南咖喱。',
      name_ru:'Куриное карри Пананг', desc_ru:'Слегка пряный карри Пананг с ароматными травами.', tags:['chicken','curry'] },
    { id:'green-curry-chicken', categoryId:'thai', price:300, sortOrder:5, imageLabel:'GC', isActive:true, soldOut:false, hidden:false,
      name_en:'Gang Kheaw Waan Gai', desc_en:'Green chicken curry with chili, basil leaves and coconut broth.',
      name_zh:'绿咖喱鸡', desc_zh:'香浓泰式绿咖喱鸡，融合辣椒与罗勒叶，佐以椰奶。',
      name_ru:'Ганг Кхеав Ваан Гай', desc_ru:'Зеленое куриное карри с чили, листьями базилика и кокосовым бульоном.', tags:['chicken','curry','spicy'] },
    { id:'khao-phad', categoryId:'thai', price:250, sortOrder:6, imageLabel:'KP', isActive:true, soldOut:false, hidden:false,
      name_en:'Khao Phad', desc_en:'Wok-fried rice with meat selection.',
      name_zh:'泰式炒饭', desc_zh:'锅炒饭（可选配料）。',
      name_ru:'Кхао Пхад', desc_ru:'Жареный в воке рис с различными видами мяса.', tags:['rice'] },
    { id:'pad-krapow', categoryId:'thai', price:250, sortOrder:7, imageLabel:'PK', isActive:true, soldOut:false, hidden:false,
      name_en:'Pad Krapow', desc_en:'Thai style fried rice with chili, basil, minced beef and crispy fried egg.',
      name_zh:'泰式罗勒炒', desc_zh:'泰式辣椒罗勒炒饭，配碎牛肉和香脆煎蛋。',
      name_ru:'Пад Крапов', desc_ru:'Жареный рис по-тайски с чили, базиликом, говяжьим фаршем и хрустящим жареным яйцом.', tags:['rice','spicy'] },
    { id:'gai-phad-med-ma-muang', categoryId:'thai', price:350, sortOrder:8, imageLabel:'GM', isActive:true, soldOut:false, hidden:false,
      name_en:'Gai Phad Med Ma Muang', desc_en:'Stir-fried chicken with cashew nut, dried chili and oyster sauce.',
      name_zh:'腰果炒鸡丁', desc_zh:'腰果炒鸡丁，配干辣椒和蚝油。',
      name_ru:'Гай Пхад Мед Ма Муанг', desc_ru:'Жареная курица с кешью, сушеным чили и устричным соусом.', tags:['chicken','nuts'] },
    { id:'phad-preaw-wann-moo', categoryId:'thai', price:350, sortOrder:9, imageLabel:'PP', isActive:true, soldOut:false, hidden:false,
      name_en:'Phad Preaw Wann Moo', desc_en:'Wok-fried pork with pineapple in sweet and sour sauce.',
      name_zh:'酸甜猪肉', desc_zh:'酸甜酱炒猪肉配菠萝。',
      name_ru:'Пад Приу Ван Порк', desc_ru:'Жареная в воке свинина с ананасом в кисло-сладком соусе.', tags:['pork'] },
    { id:'goong-ma-kham', categoryId:'thai', price:750, sortOrder:10, imageLabel:'GK', isActive:true, soldOut:false, hidden:false,
      name_en:'Goong Ma-Kham', desc_en:'Fried prawn with tamarind sauce.',
      name_zh:'罗望子虾', desc_zh:'罗望子酱炸虾。',
      name_ru:'Гунг Ма-Кхам', desc_ru:'Жареные креветки с тамариндовым соусом.', tags:['seafood'] },
    { id:'wagyu-burger', categoryId:'thai', price:450, sortOrder:11, imageLabel:'WB', isActive:true, soldOut:false, hidden:false,
      name_en:'Wagyu Beef Burger', desc_en:'Beef patty, tomato, caramelized onions, cheddar cheese, iceberg lettuce, french fries and Russian sauce.',
      name_zh:'和牛汉堡', desc_zh:'手工牛肉饼，搭配番茄、焦糖洋葱、切达芝士和冰山生菜，佐薯条与俄式酱。',
      name_ru:'Бургер из говядины Вагю', desc_ru:'Говяжья котлета, помидор, карамелизованный лук, сыр чеддер, салат айсберг, картофель фри, русский соус.', tags:['beef','burger'] },

    { id:'fish-chips', categoryId:'western', price:400, sortOrder:1, imageLabel:'FC', isActive:true, soldOut:false, hidden:false,
      name_en:'Fish & Chips', desc_en:'Served with french fries, tartar sauce and fresh lemon.',
      name_zh:'炸鱼薯条', desc_zh:'配薯条、塔塔酱和新鲜柠檬。',
      name_ru:'Рыба с картофелем фри', desc_ru:'Подается с картофелем фри, соусом тартар и свежим лимоном.', tags:['seafood'] },
    { id:'club-sandwich', categoryId:'western', price:380, sortOrder:2, imageLabel:'CS', isActive:true, soldOut:false, hidden:false,
      name_en:'Club Sandwich', desc_en:'Toasted bread layered with chicken, ham, bacon, egg, lettuce and fries.',
      name_zh:'俱乐部三明治', desc_zh:'多层烤吐司，夹以鸡肉、火腿、培根、鸡蛋和生菜，佐薯条。',
      name_ru:'Трехслойный бутерброд', desc_ru:'Поджаренный хлеб с начинкой из курицы, ветчины, бекона, яйца, салата и картофеля фри.', tags:['sandwich'] },
    { id:'chicken-nugget', categoryId:'western', price:220, sortOrder:3, imageLabel:'CN', isActive:true, soldOut:false, hidden:false,
      name_en:'Chicken Nugget', desc_en:'Served with french fries, tomato ketchup and mayonnaise.',
      name_zh:'鸡块', desc_zh:'配薯条、番茄酱和蛋黄酱。',
      name_ru:'Куриные наггетсы', desc_ru:'Подается с картофелем фри, томатным кетчупом и майонезом.', tags:['chicken'] },
    { id:'french-fries', categoryId:'western', price:180, sortOrder:4, imageLabel:'FF', isActive:true, soldOut:false, hidden:false,
      name_en:'French Fries', desc_en:'Served with garlic mayonnaise.',
      name_zh:'薯条', desc_zh:'配蒜味蛋黄酱。',
      name_ru:'Картофель фри', desc_ru:'Подается с чесночным майонезом.', tags:['snack'] },
    { id:'spaghetti-kee-mao', categoryId:'western', price:350, sortOrder:5, imageLabel:'SK', isActive:true, soldOut:false, hidden:false,
      name_en:'Spaghetti Kee Mao', desc_en:'Al dente spaghetti with seafood, tomato, chili, lemongrass, basil, cream and parmesan.',
      name_zh:'泰式醉炒意大利面', desc_zh:'Al Dente 口感意大利面，搭配海鲜、番茄、辣椒、香茅与罗勒，佐以奶油和帕玛森芝士。',
      name_ru:'Спагетти Ки Мао', desc_ru:'Спагетти с морепродуктами, помидорами, чили, лемонграссом, базиликом, сливками и пармезаном.', tags:['pasta','seafood','spicy'] },
    { id:'pad-thai-goong', categoryId:'western', price:350, sortOrder:6, imageLabel:'PT', isActive:true, soldOut:false, hidden:false,
      name_en:'Pad Thai Goong', desc_en:'Thai style wok-fried rice noodle with prawn, chives, bean sprout, lime and crushed peanuts.',
      name_zh:'泰式经典炒河粉配大虾', desc_zh:'泰式经典炒河粉，搭配大虾、韭菜、豆芽，佐以青柠与碎花生。',
      name_ru:'Пад Тай Гунг', desc_ru:'Жаренная в воке рисовая лапша по-тайски с креветками, зеленым луком, ростками фасоли, лаймом и измельченным арахисом.', tags:['noodle','seafood','nuts'] },

    { id:'bolognese', categoryId:'pasta', price:350, sortOrder:1, imageLabel:'BO', isActive:true, soldOut:false, hidden:false,
      name_en:'Bolognese', desc_en:'Beef rump house-made bolognese, basil leaf and Reggiano parmesan.',
      name_zh:'博洛尼亚肉酱', desc_zh:'精选牛臀肉自制博洛尼亚酱，佐罗勒叶与雷吉亚诺帕玛森芝士。',
      name_ru:'Болоньезе', desc_ru:'Домашний соус болоньезе из говяжьей вырезки с листьями базилика и сыром пармезан Реджано.', tags:['pasta','beef'] },
    { id:'pesto', categoryId:'pasta', price:350, sortOrder:2, imageLabel:'PE', isActive:true, soldOut:false, hidden:false,
      name_en:'Pesto', desc_en:'House-made pesto, basil leaf and Reggiano parmesan.',
      name_zh:'青酱', desc_zh:'精选罗勒自制青酱，佐雷吉亚诺帕玛森芝士。',
      name_ru:'Песто', desc_ru:'Домашний песто, листья базилика, пармезан Реджано.', tags:['pasta'] },
    { id:'arrabbiata', categoryId:'pasta', price:380, sortOrder:3, imageLabel:'AR', isActive:true, soldOut:false, hidden:false,
      name_en:'Arrabbiata', desc_en:'Spicy tomato sauce pasta.',
      name_zh:'意大利经典辣味番茄酱', desc_zh:'经典辣味番茄意面。',
      name_ru:'Аррабиата', desc_ru:'Острая паста с томатным соусом.', tags:['pasta','spicy'] },
    { id:'carbonara', categoryId:'pasta', price:350, sortOrder:4, imageLabel:'CA', isActive:true, soldOut:false, hidden:false,
      name_en:'Carbonara', desc_en:'Bacon, garlic, parsley, fresh cream, egg yolk and parmesan cheese.',
      name_zh:'卡邦尼拉', desc_zh:'香煎培根搭配大蒜与欧芹，佐以鲜奶油，收尾以蛋黄，并配雷吉亚诺帕玛森芝士。',
      name_ru:'Карбонара', desc_ru:'Бекон, чеснок, петрушка, свежие сливки, яичный желток и пармезан.', tags:['pasta'] },
    { id:'marinara', categoryId:'pasta', price:320, sortOrder:5, imageLabel:'MA', isActive:true, soldOut:false, hidden:false,
      name_en:'Marinara', desc_en:'Vine-ripened tomatoes, Italian basil, garlic, onions and extra virgin olive oil.',
      name_zh:'玛丽娜拉酱', desc_zh:'精选藤熟番茄，搭配意大利罗勒、大蒜与洋葱，佐以特级初榨橄榄油。',
      name_ru:'Маринара', desc_ru:'Помидоры, созревшие на лозе, итальянский базилик, чеснок, лук и оливковое масло первого холодного отжима.', tags:['pasta'] },
    { id:'meatball', categoryId:'pasta', price:350, sortOrder:6, imageLabel:'MB', isActive:true, soldOut:false, hidden:false,
      name_en:'Meatball', desc_en:'House-made meatball, marinara sauce and parmesan cheese.',
      name_zh:'肉丸', desc_zh:'手工自制肉丸，佐经典玛丽娜拉番茄酱，搭配帕玛森芝士。',
      name_ru:'Фрикаделька', desc_ru:'Домашние фрикадельки, соус маринара, сыр пармезан.', tags:['pasta','beef'] },

    { id:'tiramisu-cake', categoryId:'dessert', price:250, sortOrder:1, imageLabel:'TI', isActive:true, soldOut:false, hidden:false,
      name_en:'Tiramisu Cake', desc_en:'Tiramisu with ladyfingers, fresh fruit and mocha sauce.',
      name_zh:'提拉米苏蛋糕', desc_zh:'经典提拉米苏，搭配手指饼干、新鲜水果，佐以摩卡酱。',
      name_ru:'Торт Тирамису', desc_ru:'Тирамису с печеньем «дамские пальчики», свежими фруктами и соусом мокко.', tags:['dessert'] },
    { id:'chocolate-brownie', categoryId:'dessert', price:250, sortOrder:2, imageLabel:'BR', isActive:true, soldOut:false, hidden:false,
      name_en:'Chocolate Brownie', desc_en:'Brownie with vanilla ice cream, fresh fruit and chocolate sauce.',
      name_zh:'巧克力布朗尼', desc_zh:'浓郁布朗尼，搭配香草冰淇淋与新鲜水果，佐以巧克力酱。',
      name_ru:'Шоколадный брауни', desc_ru:'Брауни с ванильным мороженым, свежими фруктами и шоколадным соусом.', tags:['dessert'] },
    { id:'vanilla-creme-brulee', categoryId:'dessert', price:220, sortOrder:3, imageLabel:'VC', isActive:true, soldOut:false, hidden:false,
      name_en:'Vanilla Crème Brûlée', desc_en:'Served with fresh fruits and biscotti cookie.',
      name_zh:'香草焦糖布丁', desc_zh:'配新鲜水果和比斯科蒂饼干。',
      name_ru:'Ванильный крем-брюле', desc_ru:'Подается со свежими фруктами и печеньем бискотти.', tags:['dessert'] },
    { id:'strawberry-panna-cotta', categoryId:'dessert', price:220, sortOrder:4, imageLabel:'SP', isActive:true, soldOut:false, hidden:false,
      name_en:'Strawberry Panna Cotta', desc_en:'Berry fresh and strawberry compote.',
      name_zh:'草莓意式奶冻', desc_zh:'新鲜浆果配草莓康波特。',
      name_ru:'Клубничная панна котта', desc_ru:'Компот из свежих ягод и клубники.', tags:['dessert'] },
    { id:'passion-fruit-mousse', categoryId:'dessert', price:220, sortOrder:5, imageLabel:'PM', isActive:true, soldOut:false, hidden:false,
      name_en:'Passion Fruit Mousse', desc_en:'Passion fruit mousse served with mango and berries.',
      name_zh:'百香果奶油慕斯', desc_zh:'细腻百香果慕斯，佐以芒果和精选莓果。',
      name_ru:'Мусс из маракуйи', desc_ru:'Мусс из маракуйи, подается с манго и ягодами.', tags:['dessert'] },
    { id:'mango-sticky-rice', categoryId:'dessert', price:200, sortOrder:6, imageLabel:'MS', isActive:true, soldOut:false, hidden:false,
      name_en:'Khao Niaow Ma Muang', desc_en:'Mango sticky rice with coconut cream and sesame seeds.',
      name_zh:'泰式芒果糯米饭', desc_zh:'经典泰式芒果糯米饭，佐以椰奶与芝麻。',
      name_ru:'Клейкий рис с манго', desc_ru:'Клейкий рис с манго, кокосовыми сливками и кунжутом.', tags:['dessert'] },
    { id:'tropical-fruit-plate', categoryId:'dessert', price:200, sortOrder:7, imageLabel:'TF', isActive:true, soldOut:false, hidden:false,
      name_en:'Tropical Fruit Plate', desc_en:'Chef\'s selection of seasonal fruits.',
      name_zh:'精选热带水果拼盘', desc_zh:'主厨甄选当季水果。',
      name_ru:'Тарелка с тропическими фруктами', desc_ru:'Сезонные фрукты, отобранные шеф-поваром.', tags:['dessert','fruit'] },

    { id:'kids-fish-fingers', categoryId:'kids', price:200, sortOrder:1, imageLabel:'KF', isActive:true, soldOut:false, hidden:false,
      name_en:'Fish Fingers', desc_en:'Deep-fried fish coated with breadcrumbs, served with chips.',
      name_zh:'鱼条', desc_zh:'面包糠炸鱼，配薯条。',
      name_ru:'Рыбные палочки', desc_ru:'Жареная во фритюре рыба в панировке, подается с картофелем фри.', tags:['kids'] },
    { id:'kids-tuna-sandwich', categoryId:'kids', price:190, sortOrder:2, imageLabel:'TS', isActive:true, soldOut:false, hidden:false,
      name_en:'Tuna Sandwich', desc_en:'Served with fries.',
      name_zh:'金枪鱼三明治', desc_zh:'配薯条。',
      name_ru:'Сэндвич с тунцом', desc_ru:'Подается с картофелем фри.', tags:['kids'] },
    { id:'kids-fried-rice', categoryId:'kids', price:190, sortOrder:3, imageLabel:'KR', isActive:true, soldOut:false, hidden:false,
      name_en:'Fried Rice', desc_en:'Chicken nuggets or chicken sausage, mixed vegetable.',
      name_zh:'炒饭', desc_zh:'鸡块或鸡肉香肠，配什锦蔬菜。',
      name_ru:'Жареный рис', desc_ru:'Куриные наггетсы или куриные колбаски, овощное ассорти.', tags:['kids'] },
    { id:'kids-chicken-nuggets', categoryId:'kids', price:140, sortOrder:4, imageLabel:'KN', isActive:true, soldOut:false, hidden:false,
      name_en:'Kids Chicken Nuggets', desc_en:'Crispy chicken nuggets with fries.',
      name_zh:'儿童鸡块', desc_zh:'香脆鸡块配薯条。',
      name_ru:'Детские куриные наггетсы', desc_ru:'Хрустящие куриные наггетсы с картофелем фри.', tags:['kids'] },
    { id:'kids-napoletana', categoryId:'kids', price:160, sortOrder:5, imageLabel:'NP', isActive:true, soldOut:false, hidden:false,
      name_en:'Napoletana', desc_en:'Chunky tomato sauce, basil, chicken sausage and parmesan cheese.',
      name_zh:'那不勒斯风味', desc_zh:'手工颗粒番茄酱，搭配新鲜罗勒、鸡肉香肠，佐帕玛森芝士。',
      name_ru:'Неаполитанская', desc_ru:'Густой томатный соус, базилик, куриные колбаски и сыр пармезан.', tags:['kids','pasta'] },
    { id:'kids-carbonara', categoryId:'kids', price:190, sortOrder:6, imageLabel:'KC', isActive:true, soldOut:false, hidden:false,
      name_en:'Carbonara', desc_en:'Chicken ham, cream sauce and parmesan cheese.',
      name_zh:'卡邦尼拉', desc_zh:'鸡火腿搭配浓郁奶油酱，佐帕玛森芝士。',
      name_ru:'Карбонара', desc_ru:'Куриная ветчина, сливочный соус и сыр пармезан.', tags:['kids','pasta'] },
    { id:'kids-bolognese', categoryId:'kids', price:190, sortOrder:7, imageLabel:'KB', isActive:true, soldOut:false, hidden:false,
      name_en:'Bolognese', desc_en:'Braised beef ragu sauce and parmesan cheese.',
      name_zh:'博洛尼亚肉酱', desc_zh:'慢炖牛肉拉古酱，佐帕玛森芝士。',
      name_ru:'Болоньезе', desc_ru:'Соус рагу из тушеной говядины, сыр пармезан.', tags:['kids','pasta'] }
  ];

  const seedUsers = [
    { id: 'u_staff', username: 'staff', password: 'staff123', displayName: 'Noi Staff', role: 'staff', active: true },
    { id: 'u_hostess', username: 'hostess', password: 'hostess123', displayName: 'Hostess Demo', role: 'hostess', active: true },
    { id: 'u_admin', username: 'admin', password: 'admin123', displayName: 'Admin Demo', role: 'admin', active: true }
  ];

  const seedSettings = {
    outletName: 'The Taste',
    enabledLanguages: ['en', 'zh', 'ru'],
    orderPrefix: 'ORD',
    lastOrderNumber: 0,
    boardSoundEnabled: true,
    paymentTypes: ['cash', 'credit_card', 'qr']
  };

  function setStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function getStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function seedData(force = false) {
    const meta = getStore(KEYS.meta, null);
    if (!force && meta?.version === APP_VERSION) return;
    setStore(KEYS.categories, clone(seedCategories));
    setStore(KEYS.items, clone(seedItems));
    setStore(KEYS.users, clone(seedUsers));
    setStore(KEYS.settings, clone(seedSettings));
    setStore(KEYS.orders, []);
    setStore(KEYS.meta, { version: APP_VERSION, seededAt: Date.now() });
  }

  seedData();

  const db = {
    get categories() { return getStore(KEYS.categories, clone(seedCategories)); },
    set categories(value) { setStore(KEYS.categories, value); },
    get items() { return getStore(KEYS.items, clone(seedItems)); },
    set items(value) { setStore(KEYS.items, value); },
    get users() { return getStore(KEYS.users, clone(seedUsers)); },
    set users(value) { setStore(KEYS.users, value); },
    get settings() { return getStore(KEYS.settings, clone(seedSettings)); },
    set settings(value) { setStore(KEYS.settings, value); },
    get orders() { return getStore(KEYS.orders, []); },
    set orders(value) { setStore(KEYS.orders, value); },
    get session() { return getStore(KEYS.session, null); },
    set session(value) { setStore(KEYS.session, value); }
  };

  function showToast(message) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.style.position = 'fixed';
      toast.style.left = '50%';
      toast.style.bottom = '22px';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#4a3528';
      toast.style.color = '#fff';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '999px';
      toast.style.zIndex = '999';
      toast.style.boxShadow = '0 12px 30px rgba(0,0,0,.18)';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.style.opacity = '0', 2200);
  }

  function formatTHB(value) { return `THB ${Number(value || 0).toLocaleString()}`; }
  function escapeHtml(str='') {
    return str.replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function getName(item, lang) {
    return item[`name_${lang}`] || item.name_en || '';
  }
  function getDesc(item, lang) {
    return item[`desc_${lang}`] || item.desc_en || '';
  }
  function getCategoryName(categoryId, lang) {
    const category = db.categories.find(c => c.id === categoryId);
    return category ? (category[`name_${lang}`] || category.name_en) : categoryId;
  }
  function nowTs() { return Date.now(); }
  function formatDateTime(ts) {
    return new Date(ts).toLocaleString('en-GB', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
  }
  function roleAllowed(role, allowed) { return allowed.includes(role); }
  function getCurrentUser() { return db.session; }
  function setCurrentUser(user) {
    db.session = user ? { id:user.id, displayName:user.displayName, role:user.role, username:user.username } : null;
  }
  function logoutAndRefresh() { setCurrentUser(null); location.reload(); }
  function lockRole(allowedRoles, modalId, title) {
    const session = getCurrentUser();
    if (session && roleAllowed(session.role, allowedRoles)) return session;
    openLoginModal(modalId, title, allowedRoles);
    return null;
  }
  function initials(label='') {
    return label.split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
  }

  function getImageUrl(item) {
    return `assets/menu/${item.id}.png`;
  }

  function menuThumb(item, lang, extraClass = '', large = false) {
    const cls = ['menu-thumb', 'has-image', extraClass].filter(Boolean).join(' ');
    return `<div class="${cls}">
      <img src="${escapeHtml(getImageUrl(item))}" alt="${escapeHtml(getName(item, lang))}" loading="lazy" />
      <span class="fallback-label">${escapeHtml(item.imageLabel || initials(getName(item, lang)))}</span>
    </div>`;
  }

  function renderLangSwitch(el, selected, onChange) {
    if (!el) return;
    el.innerHTML = LANGS.map(lang => `<button class="chip ${lang.code===selected?'active':''}" data-lang="${lang.code}">${lang.label}</button>`).join('');
    el.querySelectorAll('[data-lang]').forEach(btn => btn.addEventListener('click', () => onChange(btn.dataset.lang)));
  }

  function renderCategoryTabs(el, selected, lang, onChange) {
    if (!el) return;
    const cats = db.categories.filter(c => c.isActive).sort((a,b)=>a.sortOrder-b.sortOrder);
    el.innerHTML = cats.map(cat => `<button class="chip ${cat.id===selected?'active':''}" data-id="${cat.id}">${escapeHtml(cat[`name_${lang}`] || cat.name_en)}</button>`).join('');
    el.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', ()=> onChange(btn.dataset.id)));
  }

  function itemVisible(item) {
    return item.isActive && !item.hidden;
  }

  function menuCard(item, lang, options={}) {
    const desc = getDesc(item, lang);
    const showQty = options.showQty;
    const qty = options.qty || 0;
    return `
      <article class="menu-card card">
        ${menuThumb(item, lang)}
        <div class="menu-meta">
          <h3>${escapeHtml(getName(item, lang))}</h3>
          <p>${escapeHtml(desc)}</p>
        </div>
        <div class="tag-row">${(item.tags||[]).slice(0,3).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="price-row">
          <div class="price">${formatTHB(item.price)}</div>
          ${item.soldOut ? '<span class="tag" style="color:var(--danger)">Sold Out</span>' : ''}
        </div>
        <div class="menu-actions">
          <button class="btn small secondary" data-view="${item.id}">View Detail</button>
          ${showQty ? `
            <div class="qty-control">
              <button class="btn tiny ghost" data-dec="${item.id}">-</button>
              <span class="qty-badge">${qty}</span>
              <button class="btn tiny" data-inc="${item.id}" ${item.soldOut ? 'disabled' : ''}>+</button>
              <button class="btn tiny ghost" data-note="${item.id}">Note</button>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function openModal(el, html) {
    if (!el) return;
    el.innerHTML = html;
    el.classList.remove('hidden');
    el.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(el)));
  }
  function closeModal(el) {
    if (!el) return;
    el.classList.add('hidden');
    el.innerHTML = '';
  }

  function itemDetailModal(item, lang) {
    return `
      <div class="modal-card">
        ${menuThumb(item, lang, 'detail-thumb')}
        <h2>${escapeHtml(getName(item, lang))}</h2>
        <p>${escapeHtml(getDesc(item, lang))}</p>
        <div class="status-row" style="margin-top:14px;">${(item.tags||[]).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="form-actions"><button class="btn primary" data-close="1">Close</button></div>
      </div>
    `;
  }

  function openLoginModal(modalId, title, allowedRoles) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    openModal(modal, `
      <div class="modal-card small">
        <h2>${escapeHtml(title)}</h2>
        <p>ใช้ Demo Login เพื่อทดสอบได้ทันทีบน GitHub Pages</p>
        <div class="notice">
          Staff: <strong>staff / staff123</strong><br>
          Hostess: <strong>hostess / hostess123</strong><br>
          Admin: <strong>admin / admin123</strong>
        </div>
        <form id="loginForm" class="form-grid">
          <label class="full"><span>Username</span><input name="username" type="text" required /></label>
          <label class="full"><span>Password</span><input name="password" type="password" required /></label>
          <div class="form-actions full">
            <button type="submit" class="btn primary">Login</button>
          </div>
        </form>
      </div>
    `);
    const form = modal.querySelector('#loginForm');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const username = String(fd.get('username')).trim();
      const password = String(fd.get('password')).trim();
      const user = db.users.find(u => u.username === username && u.password === password && u.active);
      if (!user || !allowedRoles.includes(user.role)) {
        showToast('Login ไม่ถูกต้องหรือไม่มีสิทธิ์');
        return;
      }
      setCurrentUser(user);
      closeModal(modal);
      location.reload();
    });
  }

  function getFilteredItems(categoryId, query) {
    const q = String(query || '').trim().toLowerCase();
    return db.items
      .filter(item => itemVisible(item))
      .filter(item => categoryId === 'all' ? true : item.categoryId === categoryId)
      .filter(item => {
        if (!q) return true;
        return [item.name_en, item.name_zh, item.name_ru, item.desc_en, item.desc_zh, item.desc_ru].join(' ').toLowerCase().includes(q);
      })
      .sort((a,b) => a.categoryId === b.categoryId ? a.sortOrder - b.sortOrder : a.categoryId.localeCompare(b.categoryId));
  }

  function getOrderSummary(order) {
    return order.items.reduce((sum, line) => sum + (line.lineTotal || 0), 0);
  }

  function createOrderNo() {
    const settings = db.settings;
    settings.lastOrderNumber += 1;
    db.settings = settings;
    const seq = String(settings.lastOrderNumber).padStart(4, '0');
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${settings.orderPrefix}-${y}${m}${day}-${seq}`;
  }

  function renderGuestPage() {
    const state = { lang: 'en', categoryId: 'all', query: '' };
    const grid = document.getElementById('guestMenuGrid');
    const search = document.getElementById('guestSearch');
    const modal = document.getElementById('menuModal');
    const callStaffBtn = document.getElementById('callStaffBtn');

    function render() {
      renderLangSwitch(document.getElementById('guestLanguageSwitch'), state.lang, (lang) => { state.lang = lang; render(); });
      renderCategoryTabs(document.getElementById('guestCategoryTabs'), state.categoryId, state.lang, (id) => { state.categoryId = id; render(); });
      const items = getFilteredItems(state.categoryId, state.query);
      grid.innerHTML = items.length ? items.map(item => menuCard(item, state.lang)).join('') : `<div class="empty-state">No menu found.</div>`;
      grid.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = db.items.find(i => i.id === btn.dataset.view);
          openModal(modal, itemDetailModal(item, state.lang));
        });
      });
    }
    search.addEventListener('input', () => { state.query = search.value; render(); });
    callStaffBtn.addEventListener('click', () => showToast('Call Staff button demo: สามารถเปลี่ยนเป็น LINE / WhatsApp / phone ได้ภายหลัง'));
    render();
  }

  function renderStaffPage() {
    const session = lockRole(['staff', 'hostess', 'admin'], 'staffLoginModal', 'Staff Login');
    if (!session) return;
    document.getElementById('staffApp').classList.remove('hidden');
    const userPill = document.getElementById('staffUserPill');
    const logoutBtn = document.getElementById('staffLogoutBtn');
    const seatNo = document.getElementById('seatNo');
    const roomNo = document.getElementById('roomNo');
    const guestCount = document.getElementById('guestCount');
    const paymentType = document.getElementById('paymentType');
    const generalComment = document.getElementById('generalComment');
    const grid = document.getElementById('staffMenuGrid');
    const cartItemsEl = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const cartMeta = document.getElementById('cartMeta');
    const modal = document.getElementById('noteModal');
    const search = document.getElementById('staffSearch');
    const cart = {};
    const state = { lang: 'en', categoryId: 'all', query: '' };
    userPill.textContent = `${session.displayName} · ${session.role}`;
    logoutBtn.addEventListener('click', logoutAndRefresh);

    function renderCart() {
      const lines = Object.values(cart);
      const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
      subtotalEl.textContent = formatTHB(subtotal);
      cartMeta.innerHTML = `
        <div class="meta-row"><span>Seat</span><strong>${escapeHtml(seatNo.value || '-')}</strong></div>
        <div class="meta-row"><span>Room</span><strong>${escapeHtml(roomNo.value || '-')}</strong></div>
        <div class="meta-row"><span>Guests</span><strong>${escapeHtml(String(guestCount.value || '1'))}</strong></div>
        <div class="meta-row"><span>Payment</span><strong>${escapeHtml(paymentType.value)}</strong></div>
      `;
      if (!lines.length) {
        cartItemsEl.innerHTML = `<div class="empty-state">ยังไม่มีรายการในตะกร้า</div>`;
        return;
      }
      cartItemsEl.innerHTML = lines.map(line => `
        <div class="cart-item">
          <div class="cart-item-row">
            <strong>${line.qty} × ${escapeHtml(getName(line.item, state.lang))}</strong>
            <span>${formatTHB(line.price * line.qty)}</span>
          </div>
          ${line.note ? `<small>Note: ${escapeHtml(line.note)}</small>` : ''}
          <div class="menu-actions" style="margin-top:10px;">
            <button class="btn tiny ghost" data-dec-cart="${line.item.id}">-</button>
            <button class="btn tiny" data-inc-cart="${line.item.id}">+</button>
            <button class="btn tiny ghost" data-note-cart="${line.item.id}">Edit Note</button>
          </div>
        </div>
      `).join('');
      cartItemsEl.querySelectorAll('[data-dec-cart]').forEach(btn => btn.addEventListener('click', ()=> updateQty(btn.dataset.decCart, -1)));
      cartItemsEl.querySelectorAll('[data-inc-cart]').forEach(btn => btn.addEventListener('click', ()=> updateQty(btn.dataset.incCart, 1)));
      cartItemsEl.querySelectorAll('[data-note-cart]').forEach(btn => btn.addEventListener('click', ()=> openNoteModal(btn.dataset.noteCart)));
    }

    function updateQty(itemId, delta) {
      const item = db.items.find(i => i.id === itemId);
      if (!item || item.soldOut) return;
      const existing = cart[itemId] || { item, qty: 0, price: item.price, note: '' };
      existing.qty += delta;
      if (existing.qty <= 0) delete cart[itemId];
      else cart[itemId] = existing;
      render();
    }

    function openNoteModal(itemId) {
      const line = cart[itemId] || { item: db.items.find(i => i.id === itemId), qty: 1, price: db.items.find(i=>i.id===itemId)?.price || 0, note: '' };
      openModal(modal, `
        <div class="modal-card small">
          <h2>${escapeHtml(getName(line.item, state.lang))}</h2>
          <p>เพิ่มคอมเมนต์เฉพาะรายการ เช่น no onion / no peanuts / less spicy</p>
          <div class="form-grid">
            <label class="full"><span>Item Note</span><textarea id="itemNoteInput" rows="4">${escapeHtml(line.note || '')}</textarea></label>
          </div>
          <div class="form-actions">
            <button class="btn secondary" data-close="1">Cancel</button>
            <button class="btn primary" id="saveNoteBtn">Save Note</button>
          </div>
        </div>
      `);
      modal.querySelector('#saveNoteBtn').addEventListener('click', () => {
        const value = modal.querySelector('#itemNoteInput').value.trim();
        if (!cart[itemId]) cart[itemId] = { item: line.item, qty: 1, price: line.price, note: value };
        else cart[itemId].note = value;
        closeModal(modal);
        render();
      });
    }

    function render() {
      renderLangSwitch(document.getElementById('staffLanguageSwitch'), state.lang, (lang) => { state.lang = lang; render(); });
      renderCategoryTabs(document.getElementById('staffCategoryTabs'), state.categoryId, state.lang, (id) => { state.categoryId = id; render(); });
      const items = getFilteredItems(state.categoryId, state.query);
      grid.innerHTML = items.length ? items.map(item => menuCard(item, state.lang, { showQty: true, qty: cart[item.id]?.qty || 0 })).join('') : `<div class="empty-state">No menu found.</div>`;
      grid.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = db.items.find(i => i.id === btn.dataset.view);
          openModal(modal, itemDetailModal(item, state.lang));
        });
      });
      grid.querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', () => updateQty(btn.dataset.inc, 1)));
      grid.querySelectorAll('[data-dec]').forEach(btn => btn.addEventListener('click', () => updateQty(btn.dataset.dec, -1)));
      grid.querySelectorAll('[data-note]').forEach(btn => btn.addEventListener('click', () => openNoteModal(btn.dataset.note)));
      renderCart();
    }

    document.getElementById('clearCartBtn').addEventListener('click', () => {
      Object.keys(cart).forEach(key => delete cart[key]);
      render();
    });
    search.addEventListener('input', () => { state.query = search.value; render(); });
    [seatNo, roomNo, guestCount, paymentType, generalComment].forEach(el => el.addEventListener('input', renderCart));
    document.getElementById('sendOrderBtn').addEventListener('click', () => {
      const lines = Object.values(cart);
      if (!lines.length) {
        showToast('กรุณาเลือกเมนูก่อนส่ง');
        return;
      }
      if (!seatNo.value.trim() && !roomNo.value.trim()) {
        showToast('กรุณาใส่ Table / Seat หรือ Room No. อย่างน้อย 1 ช่อง');
        return;
      }
      const order = {
        id: `order_${nowTs()}`,
        orderNo: createOrderNo(),
        status: 'sent',
        seatNo: seatNo.value.trim(),
        roomNo: roomNo.value.trim(),
        guestCount: Number(guestCount.value || 1),
        paymentType: paymentType.value,
        generalComment: generalComment.value.trim(),
        createdById: session.id,
        createdByName: session.displayName,
        createdAt: nowTs(),
        updatedAt: nowTs(),
        acknowledgedAt: null,
        acknowledgedByName: null,
        keyedAt: null,
        keyedByName: null,
        closedAt: null,
        closedByName: null,
        soundAlertActive: true,
        items: lines.map(line => ({
          itemId: line.item.id,
          name_en: line.item.name_en,
          name_zh: line.item.name_zh,
          name_ru: line.item.name_ru,
          qty: line.qty,
          price: line.price,
          lineComment: line.note || '',
          lineTotal: line.qty * line.price
        }))
      };
      const orders = db.orders;
      orders.unshift(order);
      db.orders = orders;
      Object.keys(cart).forEach(key => delete cart[key]);
      seatNo.value = '';
      roomNo.value = '';
      guestCount.value = 2;
      paymentType.value = 'cash';
      generalComment.value = '';
      render();
      showToast(`ส่งออเดอร์ ${order.orderNo} ขึ้นบอร์ดแล้ว`);
    });
    render();
  }

  function renderBoardPage() {
    const session = lockRole(['hostess', 'admin'], 'boardLoginModal', 'Board Login');
    if (!session) return;
    document.getElementById('boardApp').classList.remove('hidden');
    document.getElementById('boardLogoutBtn').addEventListener('click', logoutAndRefresh);
    const statsEl = document.getElementById('boardStats');
    const enableSoundBtn = document.getElementById('enableSoundBtn');
    const modal = document.getElementById('orderViewModal');
    const columns = {
      sent: document.getElementById('newOrders'),
      acknowledged: document.getElementById('ackOrders'),
      done: document.getElementById('doneOrders')
    };

    enableSoundBtn.addEventListener('click', () => {
      audioUnlocked = true;
      playBeep();
      showToast('Board sound enabled');
    });

    function updateOrder(orderId, patch) {
      const orders = db.orders;
      const index = orders.findIndex(o => o.id === orderId);
      if (index === -1) return;
      orders[index] = { ...orders[index], ...patch, updatedAt: nowTs() };
      db.orders = orders;
      render();
    }

    function viewOrder(order) {
      openModal(modal, `
        <div class="modal-card">
          <h2>${escapeHtml(order.orderNo)}</h2>
          <p>${escapeHtml(order.status.toUpperCase())} · ${formatDateTime(order.createdAt)}</p>
          <div class="notice">
            Seat: <strong>${escapeHtml(order.seatNo || '-')}</strong> &nbsp; Room: <strong>${escapeHtml(order.roomNo || '-')}</strong> &nbsp; Guests: <strong>${order.guestCount}</strong><br>
            Payment: <strong>${escapeHtml(order.paymentType)}</strong> &nbsp; Staff: <strong>${escapeHtml(order.createdByName)}</strong>
          </div>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:10px;">
            ${order.items.map(line => `<div class="cart-item"><strong>${line.qty} × ${escapeHtml(line.name_en)}</strong><br>${line.lineComment ? `<small>${escapeHtml(line.lineComment)}</small>` : ''}</div>`).join('')}
          </div>
          ${order.generalComment ? `<div class="notice">General Comment: ${escapeHtml(order.generalComment)}</div>` : ''}
          <div class="form-actions">
            <button class="btn secondary" data-close="1">Close</button>
          </div>
        </div>
      `);
    }

    function card(order) {
      return `
        <div class="board-card">
          <div class="price-row" style="margin-bottom:8px;">
            <h3>${escapeHtml(order.orderNo)}</h3>
            ${order.status === 'sent' ? '<span class="badge-new">NEW</span>' : ''}
          </div>
          <div class="meta">
            ${formatDateTime(order.createdAt)}<br>
            Seat: ${escapeHtml(order.seatNo || '-')} · Room: ${escapeHtml(order.roomNo || '-')}<br>
            Guests: ${order.guestCount} · Payment: ${escapeHtml(order.paymentType)}<br>
            Staff: ${escapeHtml(order.createdByName)}
          </div>
          <ul>${order.items.map(line => `<li>${line.qty} × ${escapeHtml(line.name_en)}${line.lineComment ? ` — ${escapeHtml(line.lineComment)}` : ''}</li>`).join('')}</ul>
          ${order.generalComment ? `<div class="footer-note">Comment: ${escapeHtml(order.generalComment)}</div>` : ''}
          <div class="actions">
            <button class="btn tiny secondary" data-view-order="${order.id}">View</button>
            ${order.status === 'sent' ? `<button class="btn tiny primary" data-ack="${order.id}">Acknowledge</button>` : ''}
            ${order.status === 'acknowledged' ? `<button class="btn tiny primary" data-keyed="${order.id}">Mark Keyed</button>` : ''}
            ${['acknowledged','keyed'].includes(order.status) ? `<button class="btn tiny secondary" data-close-order="${order.id}">Close</button>` : ''}
            ${order.status === 'keyed' ? `<button class="btn tiny ghost" data-reopen="${order.id}">Reopen</button>` : ''}
          </div>
        </div>
      `;
    }

    function renderColumn(el, orders, emptyText) {
      el.innerHTML = orders.length ? orders.map(card).join('') : `<div class="empty-state">${emptyText}</div>`;
      el.querySelectorAll('[data-view-order]').forEach(btn => btn.addEventListener('click', () => {
        const order = db.orders.find(o => o.id === btn.dataset.viewOrder);
        if (order) viewOrder(order);
      }));
      el.querySelectorAll('[data-ack]').forEach(btn => btn.addEventListener('click', () => {
        updateOrder(btn.dataset.ack, { status: 'acknowledged', soundAlertActive: false, acknowledgedAt: nowTs(), acknowledgedByName: session.displayName });
        showToast('Order acknowledged');
      }));
      el.querySelectorAll('[data-keyed]').forEach(btn => btn.addEventListener('click', () => {
        updateOrder(btn.dataset.keyed, { status: 'keyed', keyedAt: nowTs(), keyedByName: session.displayName });
        showToast('Marked as keyed');
      }));
      el.querySelectorAll('[data-close-order]').forEach(btn => btn.addEventListener('click', () => {
        updateOrder(btn.dataset.closeOrder, { status: 'closed', closedAt: nowTs(), closedByName: session.displayName });
        showToast('Order closed');
      }));
      el.querySelectorAll('[data-reopen]').forEach(btn => btn.addEventListener('click', () => {
        updateOrder(btn.dataset.reopen, { status: 'acknowledged' });
        showToast('Order reopened');
      }));
    }

    function soundLoop() {
      if (!audioUnlocked) return;
      const pending = db.orders.some(o => o.status === 'sent' && o.soundAlertActive);
      if (pending) playBeep();
    }

    function render() {
      const orders = db.orders.slice().sort((a,b) => b.createdAt - a.createdAt);
      const sent = orders.filter(o => o.status === 'sent');
      const ack = orders.filter(o => o.status === 'acknowledged');
      const done = orders.filter(o => ['keyed','closed'].includes(o.status));
      statsEl.textContent = `New ${sent.length} · Acknowledged ${ack.length} · Done ${done.length}`;
      renderColumn(columns.sent, sent, 'No new orders');
      renderColumn(columns.acknowledged, ack, 'No acknowledged orders');
      renderColumn(columns.done, done, 'No completed orders');
    }

    window.addEventListener('storage', (event) => {
      if (event.key === KEYS.orders) render();
    });
    if (boardBeepInterval) clearInterval(boardBeepInterval);
    boardBeepInterval = setInterval(soundLoop, 2500);
    render();
  }

  function renderAdminPage() {
    const session = lockRole(['admin'], 'adminLoginModal', 'Admin Login');
    if (!session) return;
    document.getElementById('adminApp').classList.remove('hidden');
    document.getElementById('adminLogoutBtn').addEventListener('click', logoutAndRefresh);
    document.getElementById('resetDemoBtn').addEventListener('click', () => {
      seedData(true);
      showToast('Demo data reset complete');
      location.reload();
    });
    const list = document.getElementById('adminList');
    const search = document.getElementById('adminSearch');
    const categoryFilter = document.getElementById('adminCategoryFilter');
    const statusFilter = document.getElementById('adminStatusFilter');
    const modal = document.getElementById('adminEditorModal');
    const state = { query: '', category: 'all', status: 'all' };

    function renderFilters() {
      const cats = db.categories.filter(c => c.id !== 'all');
      categoryFilter.innerHTML = `<option value="all">All Categories</option>${cats.map(cat => `<option value="${cat.id}">${cat.name_en}</option>`).join('')}`;
      categoryFilter.value = state.category;
    }

    function filteredItems() {
      const q = state.query.toLowerCase();
      return db.items.filter(item => {
        if (state.category !== 'all' && item.categoryId !== state.category) return false;
        if (state.status === 'active' && (!item.isActive || item.hidden || item.soldOut)) return false;
        if (state.status === 'hidden' && !item.hidden) return false;
        if (state.status === 'soldout' && !item.soldOut) return false;
        if (!q) return true;
        return [item.name_en, item.name_zh, item.name_ru, item.desc_en, item.desc_zh, item.desc_ru].join(' ').toLowerCase().includes(q);
      }).sort((a,b) => a.categoryId === b.categoryId ? a.sortOrder - b.sortOrder : a.categoryId.localeCompare(b.categoryId));
    }

    function openEditor(itemId = null) {
      const item = itemId ? clone(db.items.find(i => i.id === itemId)) : {
        id: `item-${Math.random().toString(36).slice(2,8)}`,
        categoryId: 'appetizer', price: 0, sortOrder: 99, imageLabel: 'NW', isActive: true, soldOut: false, hidden: false,
        name_en: '', desc_en: '', name_zh: '', desc_zh: '', name_ru: '', desc_ru: '', tags: []
      };
      const categories = db.categories.filter(c => c.id !== 'all');
      openModal(modal, `
        <div class="modal-card">
          <h2>${itemId ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <form id="itemForm" class="form-grid">
            <label><span>Category</span>
              <select name="categoryId">${categories.map(cat => `<option value="${cat.id}" ${cat.id===item.categoryId?'selected':''}>${cat.name_en}</option>`).join('')}</select>
            </label>
            <label><span>Price</span><input name="price" type="number" min="0" value="${item.price}" /></label>
            <label><span>Sort Order</span><input name="sortOrder" type="number" min="1" value="${item.sortOrder}" /></label>
            <label><span>Image Label</span><input name="imageLabel" type="text" value="${escapeHtml(item.imageLabel || '')}" /></label>
            <label class="full"><span>English Name</span><input name="name_en" type="text" value="${escapeHtml(item.name_en)}" required /></label>
            <label class="full"><span>English Description</span><textarea name="desc_en" rows="2">${escapeHtml(item.desc_en)}</textarea></label>
            <label class="full"><span>Chinese Name</span><input name="name_zh" type="text" value="${escapeHtml(item.name_zh)}" /></label>
            <label class="full"><span>Chinese Description</span><textarea name="desc_zh" rows="2">${escapeHtml(item.desc_zh)}</textarea></label>
            <label class="full"><span>Russian Name</span><input name="name_ru" type="text" value="${escapeHtml(item.name_ru)}" /></label>
            <label class="full"><span>Russian Description</span><textarea name="desc_ru" rows="2">${escapeHtml(item.desc_ru)}</textarea></label>
            <label class="full"><span>Tags (comma separated)</span><input name="tags" type="text" value="${escapeHtml((item.tags || []).join(', '))}" /></label>
            <label><span>Status Hidden</span><select name="hidden"><option value="false" ${!item.hidden?'selected':''}>No</option><option value="true" ${item.hidden?'selected':''}>Yes</option></select></label>
            <label><span>Status Sold Out</span><select name="soldOut"><option value="false" ${!item.soldOut?'selected':''}>No</option><option value="true" ${item.soldOut?'selected':''}>Yes</option></select></label>
            <div class="form-actions full">
              <button type="button" class="btn secondary" data-close="1">Cancel</button>
              ${itemId ? `<button type="button" class="btn ghost" id="deleteItemBtn">Delete</button>` : ''}
              <button type="submit" class="btn primary">Save Item</button>
            </div>
          </form>
        </div>
      `);
      const form = modal.querySelector('#itemForm');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const fd = new FormData(form);
        const payload = {
          id: item.id,
          categoryId: String(fd.get('categoryId')),
          price: Number(fd.get('price') || 0),
          sortOrder: Number(fd.get('sortOrder') || 99),
          imageLabel: String(fd.get('imageLabel') || '').trim() || initials(String(fd.get('name_en') || 'NA')),
          isActive: true,
          hidden: String(fd.get('hidden')) === 'true',
          soldOut: String(fd.get('soldOut')) === 'true',
          name_en: String(fd.get('name_en') || '').trim(),
          desc_en: String(fd.get('desc_en') || '').trim(),
          name_zh: String(fd.get('name_zh') || '').trim(),
          desc_zh: String(fd.get('desc_zh') || '').trim(),
          name_ru: String(fd.get('name_ru') || '').trim(),
          desc_ru: String(fd.get('desc_ru') || '').trim(),
          tags: String(fd.get('tags') || '').split(',').map(v=>v.trim()).filter(Boolean)
        };
        const items = db.items;
        const index = items.findIndex(i => i.id === item.id);
        if (index >= 0) items[index] = payload;
        else items.push(payload);
        db.items = items;
        closeModal(modal);
        render();
        showToast('Menu item saved');
      });
      const deleteBtn = modal.querySelector('#deleteItemBtn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const items = db.items.filter(i => i.id !== item.id);
          db.items = items;
          closeModal(modal);
          render();
          showToast('Menu item deleted');
        });
      }
    }

    function render() {
      renderFilters();
      const items = filteredItems();
      list.innerHTML = items.length ? items.map(item => `
        <article class="admin-row">
          <div class="admin-main">
            <div class="thumb-mini">${escapeHtml(item.imageLabel || initials(item.name_en))}</div>
            <div class="admin-copy">
              <h3>${escapeHtml(item.name_en)}</h3>
              <p>${escapeHtml(item.name_zh || '-')}<br>${escapeHtml(item.name_ru || '-')}</p>
              <div class="status-row">
                <span class="pill ${(!item.hidden && !item.soldOut) ? 'active' : ''}">${escapeHtml(getCategoryName(item.categoryId, 'en'))}</span>
                <span class="pill ${item.hidden ? 'hidden' : 'active'}">${item.hidden ? 'Hidden' : 'Visible'}</span>
                <span class="pill ${item.soldOut ? 'soldout' : 'active'}">${item.soldOut ? 'Sold Out' : 'Available'}</span>
              </div>
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;gap:10px;align-items:flex-end;">
              <strong>${formatTHB(item.price)}</strong>
              <button class="btn small primary" data-edit-item="${item.id}">Edit</button>
            </div>
          </div>
        </article>
      `).join('') : `<div class="empty-state">No items found.</div>`;
      list.querySelectorAll('[data-edit-item]').forEach(btn => btn.addEventListener('click', () => openEditor(btn.dataset.editItem)));
    }

    search.addEventListener('input', () => { state.query = search.value.trim(); render(); });
    categoryFilter.addEventListener('change', () => { state.category = categoryFilter.value; render(); });
    statusFilter.addEventListener('change', () => { state.status = statusFilter.value; render(); });
    document.getElementById('addItemBtn').addEventListener('click', () => openEditor());
    render();
  }

  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (error) {
      console.warn('beep failed');
    }
  }

  if (PAGE === 'guest') renderGuestPage();
  if (PAGE === 'staff') renderStaffPage();
  if (PAGE === 'board') renderBoardPage();
  if (PAGE === 'admin') renderAdminPage();
})();
