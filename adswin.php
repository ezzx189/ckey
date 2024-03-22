<?php
// URL del archivo m3u8
$url_m3u8 = "https://edge-live11-hr.cvattv.com.ar/live/c3eds/Adult_Swim/SA_Live_dash_enc/Adult_Swim.mpd";

// Redirige a la URL del archivo m3u8
header("Location: $url_m3u8");
exit();
?>
