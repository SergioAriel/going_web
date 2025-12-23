'use client'

import { Order } from "@/interfaces";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface OrderCardProps {
  order: Order;
  isBuyer?: boolean;
  isSeller?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, isBuyer, isSeller }) => {

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex-grow">
            <div className="flex items-center flex-wrap">
              <span className="text-gray-900 dark:text-white font-medium mr-2">Order {order._id?.toString()}</span>
              <span className="mx-2 text-gray-500 dark:text-gray-400 hidden sm:inline">•</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 sm:mt-0
                ${order.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center flex-shrink-0">
            <Link href={`/order/${order._id}?isSeller=${isSeller}`} className="text-primary hover:text-primary-dark flex items-center">
              View Details
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
            {isBuyer && order.status === 'payment_pending' && (
              <Link href={`/checkout?orderId=${order._id}`} className="ml-4 bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded">
                Retry Payment
              </Link>
            )}
          </div>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {order?.items?.map((item, index) => (
              <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                <div className="flex items-center mb-1 sm:mb-0">
                  <span className="font-medium text-gray-900 dark:text-white">{item.quantity}x</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">{item.currency} {item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};