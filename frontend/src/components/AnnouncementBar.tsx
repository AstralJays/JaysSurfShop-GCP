export default function AnnouncementBar() {
  return (
    <div className="bg-ocean-900 text-ocean-100 text-center text-xs sm:text-sm py-2 px-4">
      <span className="font-medium text-white">Free wax with every board</span>
      <span className="mx-2 text-ocean-500">·</span>
      <span>Local pickup in Huntington Beach</span>
      <span className="hidden sm:inline mx-2 text-ocean-500">·</span>
      <span className="hidden sm:inline">Open daily 9am – 7pm</span>
    </div>
  );
}
