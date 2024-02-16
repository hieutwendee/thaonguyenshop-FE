"use client";

import { useRecoilState } from "recoil";
import {
  MultiSelect,
  ActionIcon,
  Input,
  CloseButton,
  Tooltip,
  OptionsFilter,
  ComboboxItem,
} from "@mantine/core";
import {
  PurchaseOrderFilterDefaultValue,
  purchaseOrderFilterState,
} from "@/store/state/purchase-order-filter.atom";
import {
  AllocationStatus,
  OrderStatus,
  SummaryOrderStatus,
} from "@/types/order";
import { X } from "lucide-react";
import { QueryKey } from "@/constant/query-key";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import DatePickerWithRange from "@/components/date-range-picker";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { getOrder, getSummaryOrderStatus } from "@/api/order";

type OrderStatusType = {
  value: string;
  label: string;
  summaryField: keyof SummaryOrderStatus;
};

const OrderStatus: OrderStatusType[] = [
  {
    value: "PURCHASED",
    label: "Đã mua",
    summaryField: "totalPurchased",
  },
  {
    value: "NOT_PURCHASED",
    label: "Chưa mua hàng",
    summaryField: "totalUnPurchased",
  },
  {
    value: "CANCELLED",
    label: "Hủy",
    summaryField: "totalCancelled",
  },
  {
    value: "CUSTOMER_CANCELLED",
    label: "Khách hủy đơn",
    summaryField: "totalCustomerCancelled",
  },
];

const AllocationStatus: OrderStatusType[] = [
  {
    value: "ALLOCATED",
    label: "Đã chia",
    summaryField: "totalAllocated",
  },
  {
    value: "SENT",
    label: "Đã xuất",
    summaryField: "totalSent",
  },
];

const PurchaseOrderFilter = () => {
  const [keyword, setKeyword] = React.useState("");
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [purchaseOrderFilter, setPurchaseOrderFilter] = useRecoilState(
    purchaseOrderFilterState
  );
  const [color, setColor] = React.useState<number[]>([]);
  const [size, setSize] = React.useState<number[]>([]);

  const { data: purchaseOrderData, refetch } = useQuery({
    queryKey: [QueryKey.GET_PURCHASE_ORDER, purchaseOrderFilter],
    queryFn: () => getOrder(purchaseOrderFilter),
  });

  React.useEffect(() => {
    if (!date?.to || !date.from) {
      setPurchaseOrderFilter((prev) => {
        const param = { ...prev };
        delete param.startDate;
        delete param.endDate;
        return {
          ...param,
        };
      });
      return;
    }
    const startDate = format(date.from, "yyyy-MM-dd");
    const endDate = format(date.to, "yyyy-MM-dd");

    setPurchaseOrderFilter((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
  }, [date, setPurchaseOrderFilter]);

  const handleChangeOrderStatus = (value: string[]) => {
    setPurchaseOrderFilter((prev) => ({
      ...prev,
      orderStatus: value as OrderStatus[],
    }));
  };

  const handleChangeAllocationStatus = (value: string[]) => {
    setPurchaseOrderFilter((prev) => ({
      ...prev,
      allocationStatus: value as AllocationStatus[],
    }));
  };

  const handleChangeSize = (value: string[]) => {
    setSize(value.map((item) => Number(item)));
  };

  const handleChangeSizeFilter = () => {
    setPurchaseOrderFilter((prev) => ({
      ...prev,
      sizeIds: size,
    }));
  };

  const handleChangeColor = (value: string[]) => {
    setColor(value.map((item) => Number(item)));
  };

  const handleChangeColorFilter = () => {
    setPurchaseOrderFilter((prev) => ({
      ...prev,
      colorIds: color,
    }));
  };

  const sizeList = useMemo(() => {
    if (!purchaseOrderData?.size) return [];
    return purchaseOrderData.size
      .filter((item) => !!item)
      .map((item) => ({
        value: item.id.toString(),
        label: item.title,
      }));
  }, [purchaseOrderData]);

  const colorList = useMemo(() => {
    if (!purchaseOrderData?.color) return [];
    return purchaseOrderData.color
      .filter((item) => !!item)
      .map((item) => ({
        value: item.id.toString(),
        label: item.title,
      }));
  }, [purchaseOrderData]);

  const selectedColorList = useMemo(() => {
    if (!color) return [];
    return colorList
      .filter((item) => color && color.includes(Number(item.value)))
      .map((item) => item.value);
  }, [colorList, color]);

  const selectedSizeList = useMemo(() => {
    if (!size) return [];
    return sizeList
      .filter((item) => size && size.includes(Number(item.value)))
      .map((item) => item.value);
  }, [sizeList, size]);

  // const orderStatusWithSummary = useMemo(() => {
  //   if (!summaryOrderStatus) return OrderStatus;
  //   return OrderStatus.map((item) => {
  //     return {
  //       ...item,
  //       label: `${item.label} (${summaryOrderStatus[item.summaryField]}/${
  //         summaryOrderStatus.totalOrder
  //       })`,
  //     };
  //   });
  // }, [summaryOrderStatus]);

  // const allocationStatusWithSummary = useMemo(() => {
  //   if (!summaryOrderStatus) return AllocationStatus;
  //   return AllocationStatus.map((item) => {
  //     return {
  //       ...item,
  //       label: `${item.label} (${summaryOrderStatus[item.summaryField]}/${
  //         summaryOrderStatus.totalOrderAllocated
  //       })`,
  //     };
  //   });
  // }, [summaryOrderStatus]);

  const handleSearchKeyword = () => {
    setPurchaseOrderFilter((prev) => ({
      ...prev,
      query: keyword,
    }));
  };

  const handleClearFilter = () => {
    setColor([]);
    setSize([]);
    setPurchaseOrderFilter(PurchaseOrderFilterDefaultValue);
  };

  return (
    <div className="mb-3 flex gap-4 flex-col">
      <div className="flex justify-between">
        <Input
          className="w-1/3"
          placeholder="Tìm kiếm tên, mã sản phẩm"
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
          rightSectionPointerEvents="all"
          rightSection={
            <CloseButton
              aria-label="Clear input"
              onClick={() => {
                setKeyword("");
                setPurchaseOrderFilter((prev) => ({ ...prev, query: "" }));
              }}
              style={{ display: keyword ? undefined : "none" }}
            />
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearchKeyword();
          }}
        />
        <DatePickerWithRange date={date} onDateChange={setDate} />
      </div>
      <div className="flex gap-3 items-end">
        <MultiSelect
          label="Tình trạng đơn hàng"
          placeholder="Tình trạng"
          data={OrderStatus}
          value={purchaseOrderFilter.orderStatus}
          onChange={handleChangeOrderStatus}
        />
        <MultiSelect
          label="Trạng thái đơn hàng"
          placeholder="Trạng thái"
          data={AllocationStatus}
          value={purchaseOrderFilter.allocationStatus}
          onChange={handleChangeAllocationStatus}
        />
        <MultiSelect
          label="Mẫu"
          placeholder="Mẫu"
          data={colorList}
          value={selectedColorList}
          onChange={handleChangeColor}
          onDropdownClose={handleChangeColorFilter}
        />
        <MultiSelect
          label="Size"
          placeholder="Size"
          data={sizeList}
          value={selectedSizeList}
          onChange={handleChangeSize}
          onDropdownClose={handleChangeSizeFilter}
        />
        <Tooltip label="Xóa bộ lọc">
          <ActionIcon
            variant="transparent"
            color="blue"
            onClick={handleClearFilter}
          >
            <X />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
};

export default PurchaseOrderFilter;
