<?php
// Domain + field labels for SEO / breadcrumbs / no-JS catalog.
// Keep field ids in sync with CATS in src/core.body.html.
return [
  'domains' => [
    'cs'  => ['th' => 'วิทยาการคอมพิวเตอร์', 'en' => 'Computer Science'],
    'cpe' => ['th' => 'วิศวกรรมคอมพิวเตอร์',  'en' => 'Computer Engineering'],
    'se'  => ['th' => 'วิศวกรรมซอฟต์แวร์',    'en' => 'Software Engineering'],
  ],
  'fields' => [
    'sort'   => ['domain' => 'cs',  'th' => 'การเรียงลำดับ',           'en' => 'Sorting'],
    'search' => ['domain' => 'cs',  'th' => 'การค้นหา',                'en' => 'Searching'],
    'linear' => ['domain' => 'cs',  'th' => 'โครงสร้างข้อมูลเชิงเส้น',  'en' => 'Linear Data Structures'],
    'tree'   => ['domain' => 'cs',  'th' => 'โครงสร้างข้อมูลแบบต้นไม้', 'en' => 'Tree Structures'],
    'graph'  => ['domain' => 'cs',  'th' => 'กราฟและเส้นทาง',          'en' => 'Graph & Pathfinding'],
    'recur'  => ['domain' => 'cs',  'th' => 'การเรียกซ้ำ',             'en' => 'Recursion'],
    'net'    => ['domain' => 'cpe', 'th' => 'เครือข่ายคอมพิวเตอร์',    'en' => 'Networking'],
  ],
];
