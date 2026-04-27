-- ============================================================
-- Little Sprout — Make baby-media bucket publicly readable
-- getPublicUrl() requires public:true; write policies still
-- protect who can upload/delete.
-- ============================================================

update storage.buckets
set public = true
where id = 'baby-media';
