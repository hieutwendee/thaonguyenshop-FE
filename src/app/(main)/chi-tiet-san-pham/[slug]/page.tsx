"use client";
import {
  SimpleGrid,
  List,
  UnstyledButton,
  Textarea,
  Indicator,
} from "@mantine/core";
import EmblaCarousel from "@/components/embla-carousel/embla-carousel";
import { EmblaOptionsType } from "embla-carousel";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/constant/query-key";
import { getProductDetail } from "@/api/product";
import { currency } from "@/utils/currency";
import { useEffect, useMemo, useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { cn } from "@/lib/utils";
import { addOrder, editOrder, getOrderDetail } from "@/api/order";
import { OrderDetail, OrderResponse } from "@/types/order";
import { toast } from "sonner";
import { useRecoilState } from "recoil";
import { authState } from "@/store/state/auth.atom";
import InputNumber from "@/components/input-number";
import { usePathname, useRouter } from "next/navigation";
import LoginModal from "@/components/login-modal";
import { format } from "date-fns";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const OPTIONS: EmblaOptionsType = {};

const DetailProductPage = ({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { order: string };
}) => {
  const { slug } = params;
  const pathname = usePathname();
  const router = useRouter();
  const { data: productDetailData } = useQuery({
    queryKey: [QueryKey.GET_PRODUCT_DETAIL, slug],
    queryFn: () => getProductDetail(Number(slug)),
  });
  const [auth, setAuth] = useRecoilState(authState);
  const [color, setColor] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderDetail[]>([]);
  const [note, setNote] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const isEditOrder = useMemo(() => searchParams?.order, [searchParams?.order]);

  const listColor = useMemo(() => {
    if (!productDetailData) return [];
    // No color, no size
    if (productDetailData.details.length === 0) {
      return [];
    }
    // No color, have size
    const listNoColorHaveSize =
      productDetailData.details.length === 1 &&
      productDetailData.details.find(
        (detail) => Object.keys(detail.color).length === 0
      );
    if (listNoColorHaveSize) {
      return [];
    }

    // list color
    let listColorData = productDetailData.details.filter(
      (detail) => Object.keys(detail.color).length > 0
    );

    if (isEditOrder) {
      listColorData = listColorData.filter(
        (item) => item.color.id === order?.orderDetails[0]?.color?.id
      );
    }

    return listColorData.map((item) => item.color);
  }, [productDetailData, order]);

  const listSizeByColor = useMemo(() => {
    if (!productDetailData) return [];
    const listSizeNoColor = productDetailData.details.find(
      (detail) =>
        Object.keys(detail.color).length === 0 &&
        productDetailData.details.length === 1
    );
    if (listSizeNoColor) {
      return isEditOrder
        ? listSizeNoColor.size.filter(
            (size) => size.id === order?.orderDetails[0]?.size?.id
          )
        : listSizeNoColor.size;
    }
    let listSize = productDetailData.details.find(
      (detail) => detail.color.id === color
    );

    return listSize
      ? isEditOrder
        ? listSize.size.filter(
            (size) => size.id === order?.orderDetails[0]?.size?.id
          )
        : listSize.size
      : [];
  }, [productDetailData, color]);

  const totalItemInCart = useMemo(() => {
    const total: any = {};
    listColor.forEach((color) => {
      let quantity =
        cart
          .filter((item) => item.colorId === color.id)
          .reduce((acc, cur) => acc + cur.quantity, 0) || 0;
      total[color.id] = quantity;
    });
    return total;
  }, [cart, listColor]);

  const isBoughtStatus = useMemo(() => {
    return (
      productDetailData?.productStatus === "BOUGHT" ||
      productDetailData?.productStatus === "HANDLE"
    );
  }, [productDetailData]);

  const handleChangeCart = (
    value: number | string,
    sizeId: number | null,
    colorId: number | null
  ) => {
    if (!productDetailData) return;
    const newCart = [...cart];
    const index = newCart.findIndex(
      (product) => product.sizeId === sizeId && product.colorId === colorId
    );
    if (index !== -1) {
      if (Number(value) > 0) {
        newCart[index].quantity = Number(value);
      } else {
        if (isEditOrder) {
          newCart[index].quantity = Number(value);
        } else {
          newCart.splice(index, 1);
        }
      }
    } else {
      Number(value) > 0 &&
        newCart.push({
          productId: productDetailData.id,
          colorId,
          sizeId,
          quantity: Number(value),
        });
    }
    setCart(newCart);
  };

  const handleBuyProduct = async () => {
    if (!auth.isAuthenticated) {
      toast("Bạn chưa đăng nhập", {
        description: (
          <p className="text-white">Vui lòng đăng nhập để tiếp tục</p>
        ),
        style: {
          backgroundColor: "#7f1d1d",
          color: "#fff",
        },
      });
      return;
    }
    if (!productDetailData) return;
    try {
      if (isEditOrder) {
        const lastEditText = "\nLần sửa gần nhất: ";
        const indexOfNoteEditTime = note?.indexOf(lastEditText);
        const oldNoteEditTime =
          indexOfNoteEditTime !== -1 && indexOfNoteEditTime !== undefined
            ? note.substring(indexOfNoteEditTime + lastEditText.length)
            : "";
        const noteEdit =
          indexOfNoteEditTime !== -1 && indexOfNoteEditTime !== undefined
            ? note.replace(
                oldNoteEditTime,
                format(new Date(), "dd/MM/yyyy HH:mm")
              )
            : note + lastEditText + format(new Date(), "dd/MM/yyyy HH:mm");
        const order = await editOrder({
          orderId: Number(searchParams?.order),
          note: noteEdit,
          orderDetails: cart,
        });
        toast("Sửa đơn hàng thành công", {
          description: (
            <div className="w-full">
              <p className="mt-4 text-lg">
                Tổng tiền:{" "}
                <span className="font-bold">
                  {currency.format(
                    cart.reduce((acc, cur) => acc + cur.quantity, 0) *
                      productDetailData.price
                  )}
                </span>
              </p>
            </div>
          ),
        });
        router.push(pathname);
      } else {
        const order = await addOrder({
          productId: productDetailData.id,
          note,
          orderDetails: cart,
        });
        toast("Đơn hàng tạo thành công", {
          description: (
            <div className="w-full">
              <p className="mt-4 text-lg">
                Tổng tiền:{" "}
                <span className="font-bold">
                  {currency.format(
                    order.reduce((acc, cur) => acc + cur.totalPrice, 0)
                  )}
                </span>
              </p>
            </div>
          ),
        });
      }

      setCart([]);
      setNote("");
    } catch (error) {
      toast("Đã có lỗi xảy ra", {
        description: "Vui lòng thử lại sau",
      });
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isEditOrder) return;
    const orderId = searchParams.order;
    const fetchOrder = async () => {
      try {
        const order = await getOrderDetail(orderId);
        const lastEditText = "\nLần sửa gần nhất: ";
        console.log("😻 ~ fetchOrder ~ lastEditText:", lastEditText);
        const indexOfNoteEditTime = order?.note?.indexOf(lastEditText);
        const oldNote =
          indexOfNoteEditTime !== -1 && indexOfNoteEditTime !== undefined
            ? order?.note.slice(0, indexOfNoteEditTime)
            : order?.note;
        const orderCart = order.orderDetails.map((detail) => ({
          id: detail.id,
          productId: order.product.id,
          colorId: detail?.color?.id || null,
          sizeId: detail?.size?.id || null,
          quantity: detail.quantity,
        }));
        setOrder(order);
        setCart(orderCart);
        setNote(oldNote ?? "");
      } catch (error) {
        toast("Đã có lỗi xảy ra", {
          description: <p className="text-white">Vui lòng thử lại sau</p>,
          style: {
            backgroundColor: "#7f1d1d",
            color: "#fff",
          },
        });
      }
    };
    fetchOrder();
  }, [searchParams?.order]);

  return (
    <div className="p-4">
      {auth.isAuthenticated ? (
        <div className="w-full max-w-6xl mx-auto mt-12">
          {productDetailData && (
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              {/* Slider */}
              <div>
                <EmblaCarousel
                  images={
                    productDetailData.productImages.length > 0
                      ? productDetailData.productImages.map(
                          (item) => item.imageUrl
                        )
                      : [""]
                  }
                  options={OPTIONS}
                />
              </div>

              {/* Product info */}
              <div className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
                <p className="mb-2 text-sm text-gray-300">{`Mã sản phẩm: ${productDetailData.productCode}`}</p>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl first-letter:capitalize">
                    {productDetailData.name}
                  </h1>
                </div>

                <div className="mt-4">
                  <h2 className="sr-only">Chi tiết sản phẩm</h2>
                  {auth.isAuthenticated && (
                    <p className="text-3xl tracking-tight text-gray-900">
                      {currency.format(productDetailData.price)}
                    </p>
                  )}
                  <p className="text-sm xl text-gray-600 mt-4">
                    Nguồn gốc: {productDetailData?.origin}
                  </p>

                  {auth.isAuthenticated && isBoughtStatus && (
                    <p className="text-blue-600 italic font-semibold mt-4">
                      Đã mua hàng
                    </p>
                  )}

                  {auth.isAuthenticated && (
                    <div className="mt-10">
                      {/* Colors */}
                      <div>
                        <div className="flex items-center justify-between">
                          {listColor.length > 0 && (
                            <h3 className="text-sm font-medium text-gray-900">
                              Mẫu/Màu
                            </h3>
                          )}
                          {cart.length > 0 && (
                            <UnstyledButton
                              onClick={() => {
                                setCart([]);
                                setColor(null);
                              }}
                              className="text-sm font-medium text-[#35a8e0] hover:text-[#35a8e0]"
                            >
                              Xóa đơn hàng
                            </UnstyledButton>
                          )}
                        </div>
                        <RadioGroup
                          value={color}
                          onChange={setColor}
                          className="mt-4"
                        >
                          <RadioGroup.Label className="sr-only">
                            Chọn một mẫu
                          </RadioGroup.Label>
                          <div className="grid grid-cols-6 gap-4 sm:grid-cols-8 lg:grid-cols-6">
                            {listColor.map((color, index) => {
                              return (
                                <Indicator
                                  inline
                                  label={totalItemInCart[color.id]}
                                  size={16}
                                  key={index}
                                >
                                  <RadioGroup.Option
                                    value={color.id}
                                    className={({ active }) =>
                                      cn(
                                        active ? "ring-2 ring-[#35a8e0]" : "",
                                        "group relative flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1"
                                      )
                                    }
                                  >
                                    {({ active, checked }) => (
                                      <div>
                                        <RadioGroup.Label as="span">
                                          {color.title}
                                        </RadioGroup.Label>

                                        <span
                                          className={cn(
                                            active ? "border" : "border-2",
                                            checked
                                              ? "border-[#35a8e0]"
                                              : "border-transparent",
                                            "pointer-events-none absolute -inset-px rounded-md"
                                          )}
                                          aria-hidden="true"
                                        />
                                      </div>
                                    )}
                                  </RadioGroup.Option>
                                </Indicator>
                              );
                            })}
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Sizes */}
                      <div className="mt-10">
                        <div className="flex items-center justify-between">
                          {listSizeByColor.length > 0 && (
                            <h3 className="text-sm font-medium text-gray-900">
                              Size
                            </h3>
                          )}
                        </div>
                        {/* Size available */}
                        {
                          <List spacing="md" mt={4}>
                            {listSizeByColor.map((size, index) => (
                              <List.Item key={index}>
                                <div className="flex gap-3 items-center">
                                  <span className="w-24 font-semibold">
                                    {size.title}
                                  </span>
                                  <InputNumber
                                    placeholder="0"
                                    min={0}
                                    value={
                                      cart.find(
                                        (product) =>
                                          product.sizeId === size.id &&
                                          product.colorId === color
                                      )?.quantity || 0
                                    }
                                    onChange={(value) =>
                                      handleChangeCart(value, size.id, color)
                                    }
                                  />
                                </div>
                              </List.Item>
                            ))}
                          </List>
                        }
                      </div>
                      {/* No size */}
                      {(productDetailData.details.length === 0 ||
                        (color && listSizeByColor.length === 0)) && (
                        <div className="mt-10 flex gap-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              Số lượng
                            </h3>
                          </div>
                          <div className="flex gap-3 items-center">
                            <InputNumber
                              placeholder="0"
                              min={0}
                              value={
                                cart.find(
                                  (product) =>
                                    product.sizeId === null &&
                                    product.colorId === color
                                )?.quantity || 0
                              }
                              onChange={(value) =>
                                handleChangeCart(value, null, color)
                              }
                            />
                          </div>
                        </div>
                      )}

                      <Textarea
                        className="mt-6"
                        label="Ghi chú đơn hàng"
                        placeholder="Viết ghi chú tại đây"
                        value={note}
                        onChange={(event) => setNote(event.currentTarget.value)}
                        autosize
                        minRows={2}
                        maxRows={4}
                      />
                      <button
                        disabled={cart.length === 0 || isBoughtStatus}
                        className="mt-10 flex w-full items-center justify-center rounded-md border border-transparent bg-[#35a8e0] px-8 py-3 text-base font-medium text-white hover:bg-[#35a8e0] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleBuyProduct}
                      >
                        {isBoughtStatus
                          ? "Vui lòng liên hệ admin để đặt hàng"
                          : isEditOrder
                          ? "Sửa đơn hàng"
                          : "Mua ngay"}
                      </button>
                    </div>
                  )}
                </div>
                {auth.isAuthenticated && (
                  <div>
                    <p className="text-2xl tracking-tight text-gray-900 py-4 text-right">
                      Tổng tiền:{" "}
                      {currency.format(
                        cart.reduce((acc, cur) => acc + cur.quantity, 0) *
                          productDetailData.price
                      )}
                    </p>
                  </div>
                )}
                <div className="py-10">
                  <div>
                    <h3 className="text-lg font-semibold">Mô tả:</h3>
                    <div className="space-y-6">
                      <pre
                        className={cn(
                          inter.className,
                          "text-base text-gray-900 whitespace-pre-line"
                        )}
                      >
                        {productDetailData.description}
                      </pre>
                    </div>
                  </div>
                  {!auth.isAuthenticated && (
                    <LoginModal
                      customButton={
                        <button className="mt-10 flex w-full items-center justify-center rounded-md border border-transparent bg-[#35a8e0] px-8 py-3 text-base font-medium text-white hover:bg-[#35a8e0] disabled:opacity-50 disabled:cursor-not-allowed">
                          Vui lòng đăng nhập để mua hàng
                        </button>
                      }
                    />
                  )}
                </div>
              </div>
            </SimpleGrid>
          )}
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto mt-12">
          <h1 className="text-center font-semibold text-2xl">
            Yêu cầu đăng nhập để xem.
          </h1>
          <p className="text-center mt-3">
            Nếu chưa có tài khoản liên hệ Admin (zalo:{" "}
            <a href="tel:0921367363" className="text-blue-600">
              0921.367.363
            </a>
            ) để được cấp tài khoản
          </p>
        </div>
      )}
    </div>
  );
};

export default DetailProductPage;
