export class CacheKeys {
  static USER(email: string): string {
    return `user_${email}`;
  }

  static USERWITHPASS(email: string): string {
    return `user_pass_${email}`;
  }

  static USERFAVOURITE(userId: number): string {
    return `favourite_${userId}`;
  }

  static CATEGORIES(): string {
    return 'categories';
  }

  static ITEM(itemId: number) {
    return `item_${itemId}`;
  }

  static ITEMLISTPAGINATION(
    page: number,
    pageSize: number,
    search?: string,
    priceMin?: number,
    priceMax?: number,
    sortBy?: string,
    sortOrder?: string,
    category?: string[],
  ) {
    return `item_list_${page}_${pageSize}_${search}_${priceMin}_${priceMax}_${sortBy}_${sortOrder}_${category?.toString()}`;
  }

  static CURRENTORDER(userId: number) {
    return `order_current_${userId}`;
  }

  static ORDER(orderId: number) {
    return `order_${orderId}`;
  }

  static ORDERLISTPAGINATION(
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: string,
  ) {
    return `order_list_${page}_${pageSize}_${sortBy}_${sortOrder}`;
  }

  static ITEMLISTPATTERN() {
    return 'item_list_';
  }

  static ORDERLISTPATTERN() {
    return 'order_list_';
  }

  static FAVOURITEPATTERN() {
    return 'favourite_';
  }
}
