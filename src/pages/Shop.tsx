import { useEffect, useRef } from 'react';
import { Package } from 'lucide-react';
export default function Shop() {
  const shopifyContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;
    const loadShopify = () => {
      const scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
      const initShopify = () => {
        const client = (window as any).ShopifyBuy.buildClient({
          domain: 'diamond-lanes-clothing.myshopify.com',
          storefrontAccessToken: 'a9ddea15b2e2e9c7488779a553d80b4c'
        });
        (window as any).ShopifyBuy.UI.onReady(client).then((ui: any) => {
          ui.createComponent('collection', {
            id: '340574437533',
            node: shopifyContainerRef.current,
            moneyFormat: '%24%7B%7Bamount%7D%7D',
            options: {
              product: {
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      "max-width": "calc(50% - 20px)",
                      "margin-left": "20px",
                      "margin-bottom": "50px",
                      "width": "calc(50% - 20px)"
                    },
                    img: {
                      height: "calc(100% - 15px)",
                      position: "absolute",
                      left: "0",
                      right: "0",
                      top: "0"
                    },
                    imgWrapper: {
                      "padding-top": "calc(75% + 15px)",
                      position: "relative",
                      height: "0"
                    }
                  },
                  title: {
                    color: "hsl(25 30% 15%)"
                  },
                  button: {
                    ":hover": {
                      "background-color": "#ce815b"
                    },
                    "background-color": "#e58f65",
                    ":focus": {
                      "background-color": "#ce815b"
                    },
                    "border-radius": "9999px"
                  },
                  price: {
                    color: "hsl(25 30% 15%)"
                  }
                },
                buttonDestination: "modal",
                contents: {
                  options: false
                },
                text: {
                  button: "View product"
                }
              },
              productSet: {
                styles: {
                  products: {
                    "@media (min-width: 601px)": {
                      "margin-left": "-20px"
                    }
                  }
                }
              },
              modalProduct: {
                contents: {
                  img: false,
                  imgWithCarousel: true
                },
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      "max-width": "100%",
                      "margin-left": "0px",
                      "margin-bottom": "0px"
                    }
                  },
                  button: {
                    ":hover": {
                      "background-color": "#ce815b"
                    },
                    "background-color": "#e58f65",
                    ":focus": {
                      "background-color": "#ce815b"
                    },
                    "border-radius": "9999px"
                  },
                  title: {
                    "font-family": "Nunito, sans-serif",
                    "font-weight": "bold",
                    "font-size": "26px"
                  }
                },
                text: {
                  button: "Add to cart"
                }
              },
              modal: {
                styles: {
                  modal: {
                    "background-color": "hsl(150 25% 85%)"
                  }
                }
              },
              cart: {
                styles: {
                  button: {
                    ":hover": {
                      "background-color": "#ce815b"
                    },
                    "background-color": "#e58f65",
                    ":focus": {
                      "background-color": "#ce815b"
                    },
                    "border-radius": "9999px"
                  },
                  cart: {
                    "background-color": "hsl(45 30% 98%)"
                  },
                  footer: {
                    "background-color": "hsl(45 30% 98%)"
                  }
                },
                text: {
                  total: "Subtotal",
                  notice: "Coupons & discount codes are added at checkout.",
                  button: "Checkout"
                },
                contents: {
                  note: true
                },
                popup: false
              },
              toggle: {
                styles: {
                  toggle: {
                    "background-color": "#e58f65",
                    ":hover": {
                      "background-color": "#ce815b"
                    },
                    ":focus": {
                      "background-color": "#ce815b"
                    }
                  }
                }
              }
            }
          });
        });
      };
      if ((window as any).ShopifyBuy) {
        if ((window as any).ShopifyBuy.UI) {
          initShopify();
        }
      } else {
        const script = document.createElement('script');
        script.async = true;
        script.src = scriptURL;
        script.onload = initShopify;
        document.head.appendChild(script);
      }
    };
    loadShopify();
  }, []);
  return <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">   Paws Play Shop
        <Package className="w-6 h-6 text-primary" />
          Shop
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Premium products for your furry friends</p>
      </div>

      {/* Shopify Collection */}
      <div className="p-4">
        <div ref={shopifyContainerRef} id="collection-component-paws" />
      </div>
    </div>;
}