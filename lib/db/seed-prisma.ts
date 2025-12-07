import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { loadEnvFromFile } from '../env-loader'
import data from '../data'

// Load environment variables from .env file
loadEnvFromFile()

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  console.log('🌱 Starting Prisma seed...')

  // Clear existing data
  await prisma.orderItem.deleteMany()
  await prisma.orderShippingAddress.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.userAddress.deleteMany()
  await prisma.user.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.webPage.deleteMany()
  await prisma.fAQQuestion.deleteMany()
  await prisma.fAQCategory.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create users
  const users = await Promise.all(
    data.users.map(async (userData) => {
      // Password is already hashed in data.ts, so use it directly
      return prisma.user.create({
        data: {
          phone: userData.phone,
          name: userData.name,
          role: userData.role,
          password: userData.password, // Already hashed in data.ts
          address: {
            create: {
              fullName: userData.address.fullName,
              street: userData.address.street,
              city: userData.address.city,
              province: userData.address.province,
              postalCode: userData.address.postalCode,
              country: userData.address.country,
              phone: userData.address.phone,
            }
          }
        },
        include: {
          address: true
        }
      })
    })
  )

  console.log(`👥 Created ${users.length} users`)

  // Create categories
  const categories = await Promise.all(
    data.categories.map((categoryData) =>
      prisma.category.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          image: categoryData.image,
          isActive: categoryData.isActive,
        }
      })
    )
  )

  console.log(`📂 Created ${categories.length} categories`)

  // Create products
  const products = await Promise.all(
    data.products.map((productData) => {
      // Find the category by name to get the categoryId
      const category = categories.find(cat => cat.name === productData.category)
      
      return prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          categoryId: category?.id || null,
          category: productData.category,
          images: productData.images,
          brand: productData.brand,
          description: productData.description,
          productType: (productData as any).productType || 'game_code',
          price: productData.price,
          listPrice: productData.listPrice,
          countInStock: productData.countInStock,
          tags: productData.tags,
          colors: productData.colors,
          sizes: productData.sizes,
          avgRating: productData.avgRating,
          numReviews: productData.numReviews,
          ratingDistribution: productData.ratingDistribution as any,
          numSales: productData.numSales,
          isPublished: productData.isPublished,
        }
      })
    })
  )

  console.log(`📦 Created ${products.length} products`)

  // Create orders
  const orders = await Promise.all(
    data.orders.map(async (orderData) => {
      // Find a real user ID to associate with the order
      const user = users[Math.floor(Math.random() * users.length)]
      
      // Create the order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          expectedDeliveryDate: orderData.expectedDeliveryDate,
          paymentMethod: orderData.paymentMethod,
          itemsPrice: orderData.itemsPrice,
          shippingPrice: orderData.shippingPrice,
          taxPrice: orderData.taxPrice,
          totalPrice: orderData.totalPrice,
          isPaid: orderData.isPaid,
          paidAt: orderData.paidAt,
          isDelivered: orderData.isDelivered,
          deliveredAt: orderData.deliveredAt,
        }
      })

      // Create order items
      const orderItems = await Promise.all(
        orderData.orderItems.map(async (itemData) => {
          // Find a real product ID to associate with the order item
          const product = products.find(p => p.name === itemData.name)
          if (!product) return null
          
          return prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              clientId: user.id, // Use user ID as client ID
              name: itemData.name,
              slug: product.slug,
              category: itemData.category,
              quantity: itemData.quantity,
              countInStock: product.countInStock,
              image: itemData.image,
              price: itemData.price,
            }
          })
        })
      )

      // Create shipping address for the order
      if (orderData.shippingAddress) {
        await prisma.orderShippingAddress.create({
          data: {
            orderId: order.id,
            street: orderData.shippingAddress.street,
            province: orderData.shippingAddress.province,
            area: orderData.shippingAddress.area,
            apartment: orderData.shippingAddress.apartment,
            building: orderData.shippingAddress.building,
            floor: orderData.shippingAddress.floor,
            landmark: orderData.shippingAddress.landmark,
          }
        })
      }

      return order
    })
  )

  console.log(`🛒 Created ${orders.length} orders`)

  // Create settings
  const settings = await Promise.all(
    data.settings.map((settingData) =>
      prisma.setting.create({
        data: {
          common: settingData.common as any,
          site: settingData.site as any,
          carousels: settingData.carousels as any,
          availableLanguages: settingData.availableLanguages as any,
          defaultLanguage: settingData.defaultLanguage,
          availableCurrencies: settingData.availableCurrencies as any,
          defaultCurrency: settingData.defaultCurrency,
          availablePaymentMethods: settingData.availablePaymentMethods as any,
          defaultPaymentMethod: settingData.defaultPaymentMethod,
          availableDeliveryDates: settingData.availableDeliveryDates as any,
          defaultDeliveryDate: settingData.defaultDeliveryDate,
        }
      })
    )
  )

  console.log(`⚙️  Created ${settings.length} settings`)

  // Create web pages
  const webPages = await Promise.all(
    data.webPages.map((webPageData) =>
      prisma.webPage.create({
        data: {
          title: webPageData.title,
          slug: webPageData.slug,
          content: webPageData.content,
          isPublished: webPageData.isPublished,
        }
      })
    )
  )

  console.log(`📄 Created ${webPages.length} web pages`)

  // Create FAQ data
  const faqCategories = await Promise.all([
    prisma.fAQCategory.create({
      data: {
        title: 'الطلبات والتوصيل',
        slug: 'orders-delivery',
        sortOrder: 1,
        isActive: true,
        questions: {
          create: [
            {
              question: 'كيف أتأكد من استلام طلبي؟',
              answer: 'ستتلقى رسالة تأكيد بالبريد الإلكتروني فور إتمام طلبك، بالإضافة إلى رقم تتبع يمكنك استخدامه لمتابعة حالة الطلب. يمكنك أيضاً تسجيل الدخول إلى حسابك وزيارة صفحة "طلباتي" لمعرفة حالة طلبك.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'ما هي طرق الدفع المتاحة؟',
              answer: 'We accept cash on delivery, Vodafone Cash, InstaPay, and credit cards. All payment methods are safe and secure.',
              sortOrder: 2,
              isActive: true
            },
            {
              question: 'ما هي مدة التوصيل المتوقعة؟',
              answer: 'نوفر توصيل سريع خلال 4 ساعات للتوصيل الفوري، أو خلال 5 أيام عمل للتوصيل القياسي. قد تختلف المدة حسب المنطقة.',
              sortOrder: 3,
              isActive: true
            },
            {
              question: 'هل هناك رسوم توصيل؟',
              answer: 'نعم، رسوم التوصيل 4.99 جنيه، لكن التوصيل مجاني للطلبات التي تزيد عن 50 جنيه.',
              sortOrder: 4,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'المنتجات',
        slug: 'products',
        sortOrder: 2,
        isActive: true,
        questions: {
          create: [
            {
              question: 'هل منتجاتكم أصلية ومرخصة؟',
              answer: 'نعم، جميع منتجاتنا أصلية 100% ومضمونة من Xbox. نحن متجر معتمد نضمن جودة جميع المنتجات.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'هل يمكنني إرجاع أو استبدال المنتج؟',
              answer: 'يمكنك إرجاع أو استبدال المنتج خلال 7 أيام من تاريخ الاستلام إذا كان في حالة جيدة وغير User.',
              sortOrder: 2,
              isActive: true
            },
            {
              question: 'كيف أتأكد من توفر المنتج؟',
              answer: 'يمكنك الاطلاع على حالة التوفر على صفحة المنتج. إذا كان المنتج غير متوفر، يمكنك تسجيل بريدك الإلكتروني ليتم إشعارك عند عودة التوفر.',
              sortOrder: 3,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'Xbox Game Pass',
        slug: 'xbox-game-pass',
        sortOrder: 3,
        isActive: true,
        questions: {
          create: [
            {
              question: 'ما هي الاشتراكات المتاحة؟',
              answer: 'نوفر اشتراكات Xbox Game Pass Ultimate في خطط 1 شهر، 3 أشهر، 6 أشهر، و12 شهر.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'هل يمكنني cancel الاشتراك؟',
              answer: 'نعم، يمكنك cancel الاشتراك في أي وقت. لن يتم خصم أي رسوم إضافية منك بعد فترة الاشتراك المدفوعة.',
              sortOrder: 2,
              isActive: true
            },
            {
              question: 'كيف أستخدم بطاقة اشتراك Game Pass؟',
              answer: 'بعد الشراء، ستحصل على كود إلكتروني يمكنك استخدامه لتنشيط الاشتراك مباشرة على جهاز Xbox أو من خلال موقع Xbox.',
              sortOrder: 3,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'المحفظة الرقمية والبطاقات',
        slug: 'digital-wallet',
        sortOrder: 4,
        isActive: true,
        questions: {
          create: [
            {
              question: 'ما هي بطاقات الهدايا المتاحة؟',
              answer: 'نوفر بطاقات هدايا Xbox Live Gold، Xbox Game Pass، وبطاقات هدايا Microsoft Store بروحية 10، 25، 50، 100 دولار.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'كم يستغرق الوصول للبطاقة الرقمية؟',
              answer: 'عادة ما يستغرق الأمر من 5 إلى 15 دقيقة. سيتم إرسال الكود إلى بريدك الإلكتروني فور تأكيد الدفع.',
              sortOrder: 2,
              isActive: true
            },
            {
              question: 'هل يمكنني إرجاع البطاقات الرقمية؟',
              answer: 'لا يمكن إرجاع أو استبدال البطاقات الرقمية بعد الشراء لأسباب أمنية. يرجى التأكد من اختيار البطاقة الصحيحة قبل الشراء.',
              sortOrder: 3,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'الحساب والملف الشخصي',
        slug: 'account',
        sortOrder: 5,
        isActive: true,
        questions: {
          create: [
            {
              question: 'كيف أعرف حالة طلبي؟',
              answer: 'يمكنك متابعة حالة طلبك من خلال تسجيل الدخول إلى حسابك وزيارة صفحة "طلباتي".',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'كيف أغير بياناتي الشخصية؟',
              answer: 'قم بتسجيل الدخول إلى حسابك واضغط على "حسابي" لedit معلوماتك الشخصية.',
              sortOrder: 2,
              isActive: true
            },
            {
              question: 'ماذا أفعل إذا نسيت كلمة المرور؟',
              answer: 'انقر على "نسيت كلمة المرور" في صفحة تسجيل الدخول واتبع التعليمات لإعادة تعيين كلمة المرور.',
              sortOrder: 3,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'الدعم والمساعدة',
        slug: 'support',
        sortOrder: 6,
        isActive: true,
        questions: {
          create: [
            {
              question: 'كيف أتواصل مع خدمة العملاء؟',
              answer: 'يمكنك التواصل معنا عبر الهاتف: +20 123 456 7890، البريد الإلكتروني: support@xbox-store.com، أو واتساب المتاح على الموقع 24/7.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'هل توفرون دعم فني؟',
              answer: 'نعم، فريقنا الفني جاهز لمساعدتك في حل أي مشاكل تقنية قد تواجهك مع المنتجات أو الخدمات.',
              sortOrder: 2,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'الأمان والخصوصية',
        slug: 'security',
        sortOrder: 7,
        isActive: true,
        questions: {
          create: [
            {
              question: 'هل بياناتي آمنة؟',
              answer: 'نعم، نستخدم أحدث أنظمة الحماية والتشفير لضمان أمان بياناتك الشخصية والمعلومات المصرفية.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'هل تشاركون بياناتي مع جهات أخرى؟',
              answer: 'لا، نحن لا نشارك بياناتك مع أي طرف ثالث. جميع معلوماتك محفوظة بشكل آمن وسري.',
              sortOrder: 2,
              isActive: true
            }
          ]
        }
      }
    }),
    prisma.fAQCategory.create({
      data: {
        title: 'البرامج والعروض',
        slug: 'offers',
        sortOrder: 8,
        isActive: true,
        questions: {
          create: [
            {
              question: 'هل لديكم عروض خاصة؟',
              answer: 'نعم، نقدم عروض دورية وخصومات حصرية. قم بمتابعة حساباتنا على وسائل التواصل الاجتماعي للاطلاع على أحدث العروض.',
              sortOrder: 1,
              isActive: true
            },
            {
              question: 'كيف أحصل على كود خصم؟',
              answer: 'يمكنك الحصول على كود خصم من خلال الاشتراك في النشرة الإخبارية أو متابعة عروضنا الخاصة على الموقع.',
              sortOrder: 2,
              isActive: true
            }
          ]
        }
      }
    })
  ])

  console.log(`❓ Created ${faqCategories.length} FAQ categories`)

  console.log('✅ Prisma seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Prisma seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
