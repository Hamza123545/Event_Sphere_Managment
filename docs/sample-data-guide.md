# Sample Data Guide - EventSphere Platform

यह document आपको Expo, Attendee, और Exhibitor के लिए best sample data देता है।

---

## 1. 📅 Expo Event Creation (Best Sample Data)

### Example 1: Tech Innovation Expo
```json
{
  "title": "Tech Innovation Expo 2025",
  "description": "Join us for the premier technology innovation expo showcasing cutting-edge solutions in AI, cloud computing, IoT, and software development. Network with industry leaders, attend expert workshops, and discover the future of technology. This 3-day event features keynote presentations, hands-on demonstrations, and exclusive networking opportunities.",
  "theme": "Innovation & Technology",
  "dateRange": {
    "startDate": "2025-03-15T09:00:00.000Z",
    "endDate": "2025-03-17T18:00:00.000Z"
  },
  "location": {
    "venueName": "Grand Convention Center",
    "address": "123 Innovation Drive, Tech Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001"
  },
  "status": "upcoming",
  "imageUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200"
}
```

### Example 2: Healthcare & Medical Expo
```json
{
  "title": "Healthcare Innovation Summit 2025",
  "description": "A comprehensive healthcare expo bringing together medical professionals, pharmaceutical companies, and healthcare technology providers. Explore the latest medical devices, pharmaceutical innovations, and healthcare IT solutions. Features include medical equipment demonstrations, expert panel discussions, and networking sessions with industry leaders.",
  "theme": "Healthcare & Medical Technology",
  "dateRange": {
    "startDate": "2025-04-20T08:00:00.000Z",
    "endDate": "2025-04-22T17:00:00.000Z"
  },
  "location": {
    "venueName": "International Medical Center",
    "address": "456 Health Avenue, Medical District",
    "city": "Delhi",
    "state": "Delhi",
    "country": "India",
    "zipCode": "110001"
  },
  "status": "upcoming",
  "imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200"
}
```

### Example 3: Fashion & Lifestyle Expo
```json
{
  "title": "Fashion Week India 2025",
  "description": "Experience the ultimate fashion and lifestyle expo featuring renowned designers, luxury brands, and emerging fashion trends. Discover exclusive collections, attend fashion shows, and network with industry professionals. This event showcases the best of Indian and international fashion, beauty products, and lifestyle brands.",
  "theme": "Fashion & Lifestyle",
  "dateRange": {
    "startDate": "2025-05-10T10:00:00.000Z",
    "endDate": "2025-05-12T20:00:00.000Z"
  },
  "location": {
    "venueName": "Luxury Fashion Hall",
    "address": "789 Style Boulevard, Fashion District",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "zipCode": "560001"
  },
  "status": "upcoming",
  "imageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"
}
```

### Example 4: Food & Beverage Expo
```json
{
  "title": "Culinary Excellence Expo 2025",
  "description": "A gastronomic journey featuring the finest food and beverage companies, restaurants, and culinary experts. Sample gourmet products, attend cooking demonstrations, and learn from master chefs. This expo brings together food manufacturers, restaurant chains, beverage companies, and culinary enthusiasts.",
  "theme": "Food & Beverage",
  "dateRange": {
    "startDate": "2025-06-05T09:00:00.000Z",
    "endDate": "2025-06-07T18:00:00.000Z"
  },
  "location": {
    "venueName": "Culinary Arts Center",
    "address": "321 Food Street, Culinary Quarter",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "411001"
  },
  "status": "upcoming",
  "imageUrl": "https://images.unsplash.com/photo-1556910103-2c027eb9efab?w=1200"
}
```

---

## 2. 👤 Attendee Registration (Best Sample Data)

### Example 1: Tech Professional
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "preferences": {
    "interests": [
      "Artificial Intelligence",
      " ",
      "Software Development",
      "Data Analytics",
      "Cybersecurity"
    ],
    "dietaryRestrictions": []
  }
}
```

### Example 2: Healthcare Professional
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "preferences": {
    "interests": [
      "Medical Devices",
      "Pharmaceuticals",
      "Healthcare IT",
      "Telemedicine",
      "Medical Research"
    ],
    "dietaryRestrictions": ["Vegetarian"]
  }
}
```

### Example 3: Business Executive
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "preferences": {
    "interests": [
      "Business Solutions",
      "Enterprise Software",
      "Digital Transformation",
      "Marketing Technology",
      "E-commerce"
    ],
    "dietaryRestrictions": ["No Nuts", "Gluten Free"]
  }
}
```

### Example 4: Student/Researcher
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "preferences": {
    "interests": [
      "Research & Development",
      "Innovation",
      "Startups",
      "Technology Trends",
      "Networking"
    ],
    "dietaryRestrictions": ["Vegan"]
  }
}
```

### Common Interest Categories:
- **Technology**: AI, Cloud Computing, IoT, Blockchain, Cybersecurity, Software Development
- **Healthcare**: Medical Devices, Pharmaceuticals, Healthcare IT, Telemedicine
- **Business**: Enterprise Solutions, Digital Marketing, E-commerce, Finance
- **Lifestyle**: Fashion, Beauty, Food & Beverage, Travel, Entertainment
- **Education**: E-learning, Research, Innovation, Startups

### Common Dietary Restrictions:
- Vegetarian
- Vegan
- Gluten Free
- No Nuts
- Halal
- Kosher
- Dairy Free

---

## 3. 🏢 Exhibitor Profile (Best Sample Data)

### Example 1: Software Company
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "companyName": "TechSolutions India Pvt. Ltd.",
  "description": "Leading provider of enterprise software solutions and cloud services. We specialize in custom software development, cloud migration, and digital transformation services. Our team of 200+ experts has delivered solutions for Fortune 500 companies across various industries.",
  "category": "Software Development",
  "productsServices": [
    "Enterprise Cloud Platform - Scalable cloud infrastructure solutions",
    "AI Analytics Suite - Advanced analytics with machine learning capabilities",
    "Custom Software Development - Tailored solutions for your business needs",
    "Digital Transformation Consulting - Strategic technology consulting"
  ],
  "contactInfo": {
    "email": "contact@techsolutions.in",
    "phone": "+91-9876543210",
    "website": "https://www.techsolutions.in"
  },
  "logo": "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400"
}
```

### Example 2: Medical Device Company
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "companyName": "MedTech Innovations Ltd.",
  "description": "Pioneering medical device manufacturer specializing in diagnostic equipment, surgical instruments, and patient monitoring systems. With over 15 years of experience, we serve hospitals and clinics across India with cutting-edge medical technology.",
  "category": "Medical Devices",
  "productsServices": [
    "Diagnostic Imaging Equipment - Advanced MRI and CT scan machines",
    "Surgical Instruments - Precision surgical tools and equipment",
    "Patient Monitoring Systems - Real-time health monitoring solutions",
    "Medical Device Maintenance - Comprehensive service and support"
  ],
  "contactInfo": {
    "email": "info@medtechinnovations.in",
    "phone": "+91-9876543211",
    "website": "https://www.medtechinnovations.in"
  },
  "logo": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400"
}
```

### Example 3: Fashion Brand
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "companyName": "Elegance Fashion House",
  "description": "Premium fashion brand offering contemporary and traditional clothing for men and women. We combine traditional Indian craftsmanship with modern design aesthetics. Our collections feature sustainable fashion and ethical manufacturing practices.",
  "category": "Fashion & Apparel",
  "productsServices": [
    "Women's Wear - Designer sarees, lehengas, and contemporary wear",
    "Men's Wear - Traditional and modern formal wear collections",
    "Accessories - Handbags, jewelry, and fashion accessories",
    "Custom Tailoring - Bespoke clothing services"
  ],
  "contactInfo": {
    "email": "hello@elegancefashion.in",
    "phone": "+91-9876543212",
    "website": "https://www.elegancefashion.in"
  },
  "logo": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
}
```

### Example 4: Food & Beverage Company
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "companyName": "Gourmet Foods India",
  "description": "Premium food and beverage company specializing in organic and artisanal products. We offer a wide range of gourmet snacks, beverages, and specialty foods. Our products are made with natural ingredients and traditional recipes.",
  "category": "Food & Beverage",
  "productsServices": [
    "Organic Snacks - Healthy and delicious snack options",
    "Artisanal Beverages - Craft beverages and specialty drinks",
    "Gourmet Food Products - Premium food items and ingredients",
    "Custom Catering - Event catering and food services"
  ],
  "contactInfo": {
    "email": "info@gourmetfoods.in",
    "phone": "+91-9876543213",
    "website": "https://www.gourmetfoods.in"
  },
  "logo": "https://images.unsplash.com/photo-1556910103-2c027eb9efab?w=400"
}
```

### Example 5: E-commerce Platform
```json
{
  "expoId": "YOUR_EXPO_ID_HERE",
  "companyName": "ShopEasy Marketplace",
  "description": "Leading e-commerce platform connecting buyers and sellers across India. We provide a seamless online shopping experience with millions of products, secure payment options, and fast delivery. Join thousands of sellers on our platform.",
  "category": "E-commerce",
  "productsServices": [
    "Online Marketplace - Multi-vendor e-commerce platform",
    "Seller Services - Tools and support for online sellers",
    "Logistics Solutions - Integrated shipping and delivery services",
    "Payment Gateway - Secure payment processing solutions"
  ],
  "contactInfo": {
    "email": "business@shopeasy.in",
    "phone": "+91-9876543214",
    "website": "https://www.shopeasy.in"
  },
  "logo": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400"
}
```

### Common Categories for Exhibitors:
- Software Development
- Medical Devices
- Healthcare IT
- Fashion & Apparel
- Food & Beverage
- E-commerce
- Manufacturing
- Real Estate
- Education Technology
- Financial Services
- Marketing & Advertising
- Travel & Tourism
- Automotive
- Energy & Utilities

---

## 📝 Important Notes:

1. **Expo Dates**: Always use future dates (at least 7 days from today)
2. **Status**: Use `"upcoming"` for new expos, `"draft"` for work in progress
3. **Image URLs**: Use valid image URLs (Unsplash, Pexels, or your own CDN)
4. **Phone Numbers**: Use Indian format (+91-XXXXXXXXXX) or international format
5. **Email**: Must be valid email format
6. **Website**: Must start with `http://` or `https://`
7. **Description**: Minimum 20 characters, maximum 5000 characters
8. **Title**: Minimum 5 characters, maximum 200 characters

---

## 🚀 Quick Start:

1. **Create Expo**: Use any Expo example above
2. **Register as Attendee**: Use Attendee example with your expo ID
3. **Create Exhibitor Profile**: Use Exhibitor example with your expo ID

---

## 💡 Tips:

- **For Testing**: Use simple, clear descriptions
- **For Production**: Use detailed, professional descriptions
- **Images**: Use high-quality images (1200x600px recommended)
- **Categories**: Choose categories that match your expo theme
- **Interests**: Select 3-5 relevant interests for attendees

---

**Happy Event Management! 🎉**

