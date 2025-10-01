export class DashboardListItemDto {
  uuid: string;
  name: string;
  description: string;
  ownerUuid: string;
  tileCount: number;
  updatedAt: string;
  isOwner: boolean;  // True if current user is owner or admin
  _links: {
    self: { href: string };
    data: { href: string };
    duplicate: { href: string };
  };
}
