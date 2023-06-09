import axios from 'axios'
import cheerio from 'cheerio'
import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose';

//configue the environment
dotenv.config();
const PORT = process.env.PORT

const app = express();
app.use(express.json())

// MongoDB Connection Setup
mongoose.connect('mongodb+srv://radhika:radhika@cluster1.mszk2mo.mongodb.net/?retryWrites=true&w=majority', 
{ 
useNewUrlParser: true, 
useUnifiedTopology: true 
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

// Define Product Schema
const productSchema = new mongoose.Schema({
  source: String,
  image: String,
  title: String,
  rating: String,
  price: String,
  finalPrice: String
});

const Product = mongoose.model('Product', productSchema);

// Scrape Flipkart
const scrapeFlipkart = async () => {
  try {
    const url = 'https://www.flipkart.com/mobiles/pr?sid=tyy%2C4io&sort=popularity';
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const products = [];
    //s1Q9rs
    $('._13oc-S').each((index, element) => {
      const image = $(element).find('img').attr('src');
      const title = $(element).find('a').text().trim();
      const rating = $(element).find('div._3LWZlK').text().trim();
      const price = $(element).find('div._30jeq3._1_WHN1').text().trim();
      const finalPrice = $(element).find('div._3I9_wc._27UcVY').text().trim();

      products.push({ source: 'Flipkart', image, title, rating, price, finalPrice });
    });
    console.log(products)
    await Product.insertMany(products);
    console.log('Flipkart data scraped and saved to the database.');
  } catch (error) {
    console.log('Error scraping Flipkart:', error);
  }
};

// Scrape Amazon
const scrapeAmazon = async () => {
  try {
    const url = 'https://www.amazon.com/s?k=mobiles&ref=nb_sb_noss';
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const products = [];
    //div[data-component-type="s-search-result"]
    $('div[data-component-type="s-search-result"]').each((index, element) => {
      const image = $(element).find('img.s-image').attr('src');
      const title = $(element).find('span.a-size-base-plus').text().trim();
      const rating = $(element).find('span[aria-label]').text().trim();
      const price = $(element).find('span.a-offscreen').first().text().trim();
      const finalPrice = $(element).find('span[aria-hidden="true"]').text().trim();

      products.push({ source: 'Amazon', image, title, rating, price });
    });

    await Product.insertMany(products);
    console.log('Amazon data scraped and saved to the database.');
  } catch (error) {
    console.log('Error scraping Amazon:', error);
  }
};

// Scrape Snapdeal
const scrapeSnapdeal = async () => {
  try {
    const url = 'https://www.snapdeal.com/search?keyword=mobiles&santizedKeyword=mobiles&catId=0&categoryId=0&suggested=false&vertical=p&noOfResults=20&searchState=categoryNavigation&clickSrc=go_header&lastKeyword=&prodCatId=&changeBackToAll=false&foundInAll=false&categoryIdSearched=&cityPageUrl=&categoryUrl=&url=&utmContent=&dealDetail=&sort=rlvncy';
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const products = [];

    $('.product-tuple-listing').each((index, element) => {
      const image = $(element).find('img.product-image').attr('src');
      const title = $(element).find('p.product-title').text().trim();
      const rating = $(element).find('span.product-rating-count').text().trim();
      const price = $(element).find('span.product-price').text().trim();

      products.push({ source: 'Snapdeal', image, title, rating, price });
    });

    await Product.insertMany(products);
    console.log('Snapdeal data scraped and saved to the database.');
  } catch (error) {
    console.log('Error scraping Snapdeal:', error);
  }
};

// Run all scraping functions simultaneously
const runScraping = async () => {
  try {
    await Promise.all([scrapeFlipkart(), scrapeAmazon(), scrapeSnapdeal()]);
    console.log('Scraping completed.');
  } catch (error) {
    console.log('Error running scraping:', error);
  }
};

// Run initial scraping on application load
runScraping();

// Schedule scraping every 12 hours
setInterval(runScraping, 12 * 60 * 60 * 1000);


app.listen(PORT, ()=>console.log(`server running in the localhost:${PORT}`))




