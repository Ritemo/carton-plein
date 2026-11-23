// =====================================================================
// CARTON PLEIN : les vrais championnats 2026-2027
// Format : id|Nom|CODE|couleur1|couleur2|force (1 à 5)|style (facultatif)
// =====================================================================
const DONNEES_LIGUES = {
  fr: {
    1: `psg|Paris SG|PSG|#1b2a5c|#d1202f|5|possession
om|Marseille|OM|#2fa8e0|#ffffff|5|feu
monaco|Monaco|ASM|#e30613|#ffffff|4|contre
lille|Lille|LOSC|#e01e13|#20325f|4|pressing
lyon|Lyon|OL|#ffffff|#da0812|4|possession
lens|Lens|RCL|#fff200|#e2001a|4|feu
nice|Nice|OGCN|#e2001a|#111111|4|bloc
rennes|Rennes|SRFC|#e13327|#111111|4|pressing
strasbourg|Strasbourg|RCSA|#009fe3|#ffffff|3|possession
brest|Brest|SB29|#e30613|#ffffff|3|aerien
toulouse|Toulouse|TFC|#6b3fa0|#ffffff|3|contre
parisfc|Paris FC|PFC|#1d3c8f|#ffffff|3|pressing
auxerre|Auxerre|AJA|#ffffff|#0055a4|2|bloc
angers|Angers|SCO|#111111|#ffffff|2|physique
lehavre|Le Havre|HAC|#8fc1e8|#1d3c8f|2|bloc
lorient|Lorient|FCL|#f58220|#111111|2|possession
lemans|Le Mans|LMFC|#e2001a|#ffd200|1|feu
troyes|Troyes|ESTAC|#0055a4|#ffffff|1|contre`,
    2: `nantes|Nantes|FCN|#fcd405|#00843d|4|contre
metz|Metz|FCM|#8a1538|#ffffff|4|bloc
asse|Saint-Étienne|ASSE|#00843d|#ffffff|4|feu
reims|Reims|SDR|#e2001a|#ffffff|4|pressing
montpellier|Montpellier|MHSC|#f58220|#1d3c8f|3|physique
guingamp|Guingamp|EAG|#e2001a|#111111|3|aerien
clermont|Clermont|CF63|#8a1538|#1d3c8f|3|possession
redstar|Red Star|RSFC|#00843d|#ffffff|3|pressing
sochaux|Sochaux|FCSM|#ffd200|#1d3c8f|3|feu
annecy|Annecy|FCA|#e2001a|#ffffff|2|possession
dijon|Dijon|DFCO|#e2001a|#ffffff|2|contre
dunkerque|Dunkerque|USLD|#0055a4|#ffffff|2|pressing
grenoble|Grenoble|GF38|#1d4f91|#ffffff|2|bloc
laval|Laval|SL53|#f58220|#111111|2|physique
nancy|Nancy|ASNL|#e2001a|#ffffff|2|aerien
pau|Pau|PAU|#ffd200|#1d3c8f|2|contre
rodez|Rodez|RAF|#e2001a|#ffd200|2|feu
boulogne|Boulogne|USBCO|#e2001a|#111111|1|physique`,
    3: `amiens|Amiens|ASC|#ffffff|#111111|4|bloc
bastia|Bastia|SCB|#0055a4|#ffffff|4|feu
caen|Caen|SMC|#1d3c8f|#e2001a|4|contre
valenciennes|Valenciennes|VAFC|#e2001a|#ffffff|3|physique
rouen|Rouen|FCR|#e2001a|#ffffff|3|aerien
versailles|Versailles|FC78|#1d3c8f|#ffffff|3|possession
orleans|Orléans|USO|#ffd200|#e2001a|3|pressing
quevilly|Quevilly-Rouen|QRM|#e2001a|#ffd200|3|contre
concarneau|Concarneau|USC|#e2001a|#111111|2|feu
bourg|Bourg-Péronnas|FBBP|#e2001a|#ffffff|2|bloc
villefranche|Villefranche|FCVB|#e2001a|#1d3c8f|2|physique
aubagne|Aubagne|AFC|#00843d|#ffffff|2|pressing
cannes|Cannes|ASCF|#e2001a|#ffffff|2|possession
fleury|Fleury|FCF|#0055a4|#ffffff|2|contre
lepuy|Le Puy|PUY|#1d3c8f|#ffffff|2|aerien
laroche|La Roche-sur-Yon|LRVF|#1d3c8f|#ffd200|1|bloc
paris13|Paris 13 Atletico|P13|#e2001a|#ffffff|1|feu
thionville|Thionville|TL|#ffd200|#1d3c8f|1|physique`
  },
  en: {
    1: `arsenal|Arsenal|ARS|#ef0107|#ffffff|5|possession
liverpool|Liverpool|LIV|#c8102e|#ffffff|5|pressing
mancity|Manchester City|MCI|#6cabdd|#1c2c5b|5|possession
chelsea|Chelsea|CHE|#034694|#ffffff|4|contre
manutd|Manchester United|MUN|#da291c|#fbe122|4|contre
newcastle|Newcastle|NEW|#241f20|#ffffff|4|feu
tottenham|Tottenham|TOT|#ffffff|#132257|4|pressing
villa|Aston Villa|AVL|#670e36|#95bfe5|4|bloc
brighton|Brighton|BHA|#0057b8|#ffffff|3|possession
bournemouth|Bournemouth|BOU|#da291c|#111111|3|pressing
brentford|Brentford|BRE|#e30613|#ffffff|3|aerien
palace|Crystal Palace|CRY|#1b458f|#c4122e|3|contre
everton|Everton|EVE|#003399|#ffffff|3|bloc
fulham|Fulham|FUL|#ffffff|#111111|3|possession
forest|Nottingham Forest|NFO|#dd0000|#ffffff|3|contre
leeds|Leeds|LEE|#ffffff|#1d428a|2|feu
sunderland|Sunderland|SUN|#eb172b|#ffffff|2|feu
coventry|Coventry|COV|#59cbe8|#ffffff|2|pressing
ipswich|Ipswich|IPS|#0044a9|#ffffff|2|contre
hull|Hull City|HUL|#f5a12d|#111111|1|physique`,
    2: `westham|West Ham|WHU|#7a263a|#1bb1e7|4|aerien
wolves|Wolverhampton|WOL|#fdb913|#231f20|4|contre
southampton|Southampton|SOU|#d71920|#ffffff|4|possession
burnley|Burnley|BUR|#6c1d45|#99d6ea|4|physique
sheffield|Sheffield United|SHU|#ee2737|#111111|3|aerien
boro|Middlesbrough|MID|#e11b22|#ffffff|3|bloc
norwich|Norwich|NOR|#fff200|#00a650|3|possession
watford|Watford|WAT|#fbee23|#ed2127|3|feu
wba|West Bromwich|WBA|#122f67|#ffffff|3|bloc
millwall|Millwall|MIL|#001d5e|#ffffff|3|physique
birmingham|Birmingham|BIR|#0000ff|#ffffff|3|pressing
wrexham|Wrexham|WRE|#d71920|#ffffff|3|feu
blackburn|Blackburn|BLA|#009ee0|#ffffff|2|contre
bolton|Bolton|BOL|#ffffff|#263c7e|2|possession
bristol|Bristol City|BRC|#e21b23|#ffffff|2|pressing
cardiff|Cardiff|CAR|#0070b5|#ffffff|2|bloc
charlton|Charlton|CHA|#d4021d|#ffffff|2|feu
derby|Derby County|DER|#ffffff|#111111|2|contre
portsmouth|Portsmouth|POR|#001489|#ffffff|2|feu
preston|Preston|PNE|#ffffff|#001d5e|2|physique
qpr|QPR|QPR|#1d5ba4|#ffffff|2|possession
stoke|Stoke|STK|#e03a3e|#ffffff|2|physique
swansea|Swansea|SWA|#ffffff|#111111|2|possession
lincoln|Lincoln|LIN|#e2001a|#ffffff|1|aerien`,
    3: `leicester|Leicester|LEI|#003090|#fdbe11|5|contre
sheffwed|Sheffield Wednesday|SHW|#0033a0|#ffffff|4|feu
luton|Luton|LUT|#f78f1e|#002d62|4|physique
huddersfield|Huddersfield|HUD|#0e63ad|#ffffff|3|pressing
bradford|Bradford|BRA|#8a1538|#fdb913|3|feu
oxford|Oxford United|OXF|#ffd200|#1d3c8f|3|contre
plymouth|Plymouth|PLY|#00573f|#ffffff|3|aerien
stockport|Stockport|STO|#1d3c8f|#ffffff|3|pressing
wimbledon|AFC Wimbledon|AFCW|#1d3c8f|#ffd200|2|bloc
barnsley|Barnsley|BAR|#d71920|#ffffff|2|physique
blackpool|Blackpool|BLP|#f68712|#ffffff|2|aerien
doncaster|Doncaster|DON|#e2001a|#ffffff|2|feu
orient|Leyton Orient|LOR|#e2001a|#ffffff|2|possession
mansfield|Mansfield|MAN|#ffd200|#1d3c8f|2|physique
mkdons|MK Dons|MKD|#ffffff|#111111|2|possession
notts|Notts County|NCO|#111111|#ffffff|2|contre
peterborough|Peterborough|PET|#005090|#ffffff|2|possession
reading|Reading|REA|#004494|#ffffff|2|contre
wigan|Wigan|WIG|#1d59af|#ffffff|2|bloc
wycombe|Wycombe|WYC|#6cace4|#1d3c8f|2|aerien
bromley|Bromley|BRO|#111111|#ffffff|1|pressing
burton|Burton Albion|BRT|#ffd200|#111111|1|bloc
cambridge|Cambridge United|CAM|#ffd200|#111111|1|physique
stevenage|Stevenage|STE|#e2001a|#ffffff|1|aerien`
  },
  es: {
    1: `real|Real Madrid|RMA|#ffffff|#febe10|5|contre
barca|Barcelone|FCB|#a50044|#004d98|5|possession
atletico|Atlético Madrid|ATM|#cb3524|#ffffff|5|bloc
athletic|Athletic Bilbao|ATH|#ee2523|#ffffff|4|pressing
villarreal|Villarreal|VIL|#ffe667|#005187|4|possession
betis|Betis Séville|BET|#0bb363|#ffffff|4|feu
sociedad|Real Sociedad|RSO|#0067b1|#ffffff|3|possession
celta|Celta Vigo|CEL|#8ac3ee|#ffffff|3|possession
osasuna|Osasuna|OSA|#d91a21|#0a346f|3|physique
rayo|Rayo Vallecano|RAY|#ffffff|#e2001a|3|pressing
sevilla|FC Séville|SEV|#ffffff|#d4021d|3|feu
valencia|Valence|VCF|#ffffff|#ee3524|3|contre
alaves|Alavés|ALA|#0761af|#ffffff|2|bloc
getafe|Getafe|GET|#005999|#ffffff|2|physique
espanyol|Espanyol|ESP|#007fc8|#ffffff|2|contre
elche|Elche|ELC|#ffffff|#00843d|2|possession
depor|Deportivo La Corogne|DEP|#0066b3|#ffffff|2|feu
levante|Levante|LEV|#0055a4|#a50044|1|contre
malaga|Málaga|MCF|#0098d7|#ffffff|1|feu
racing|Racing Santander|RAC|#ffffff|#007a3d|1|aerien`,
    2: `girona|Gérone|GIR|#cd2534|#ffffff|4|possession
mallorca|Majorque|RCDM|#e20613|#111111|4|bloc
almeria|Almería|ALM|#e2001a|#ffffff|4|contre
laspalmas|Las Palmas|LPA|#ffe400|#0055a4|4|possession
valladolid|Valladolid|VAL|#6b2c91|#ffffff|3|bloc
granada|Grenade|GRA|#e2001a|#ffffff|3|feu
leganes|Leganés|LEG|#0055a4|#ffffff|3|physique
cadiz|Cadix|CAD|#ffd200|#0055a4|3|feu
eibar|Eibar|EIB|#a50044|#004d98|3|pressing
oviedo|Real Oviedo|OVI|#0055a4|#ffffff|3|feu
sporting|Sporting Gijón|SPG|#e2001a|#ffffff|3|feu
albacete|Albacete|ALB|#ffffff|#e2001a|2|contre
andorra|Andorre|AND|#1d3c8f|#ffd200|2|possession
burgos|Burgos|BUR|#111111|#ffffff|2|physique
castellon|Castellón|CAS|#111111|#ffffff|2|possession
cordoba|Córdoba|COR|#ffffff|#00843d|2|contre
tenerife|Tenerife|TEN|#ffffff|#003da5|2|bloc
celtab|Celta Fortuna|CEB|#8ac3ee|#ffffff|1|possession
ceuta|Ceuta|CEU|#111111|#ffffff|1|bloc
eldense|Eldense|ELD|#1d3c8f|#e2001a|1|physique
sociedadb|Real Sociedad B|RSB|#0067b1|#ffffff|1|pressing
sabadell|Sabadell|SAB|#0055a4|#ffffff|1|aerien`,
    3: `# Groupe 1
mirandes|Mirandés|MIR|#e2001a|#111111|4|pressing
cultural|Cultural Leonesa|CYD|#ffffff|#111111|3|possession
lugo|Lugo|LUG|#e2001a|#ffffff|3|bloc
ferrol|Racing Ferrol|FER|#6b2c91|#ffffff|3|feu
ponferradina|Ponferradina|PON|#0055a4|#ffffff|3|physique
aviles|Avilés|AVI|#0055a4|#ffffff|2|contre
barakaldo|Barakaldo|BAR|#ffd200|#111111|2|aerien
bilbaoath|Bilbao Athletic|BAT|#ee2523|#ffffff|2|pressing
cacereno|Cacereño|CAC|#00843d|#ffffff|2|bloc
extremadura|Extremadura|EXT|#00843d|#111111|2|feu
logrones|UD Logroñés|LOG|#e2001a|#ffffff|2|contre
merida|Mérida|MER|#8a1538|#ffffff|2|physique
pontevedra|Pontevedra|PTV|#8a1538|#ffffff|2|feu
unionistas|Unionistas|UNI|#ffffff|#111111|2|possession
zamora|Zamora|ZAM|#ffffff|#e2001a|2|bloc
arenas|Arenas Getxo|ARE|#e2001a|#111111|1|aerien
coria|Coria|CRI|#e2001a|#ffffff|1|physique
fabril|Deportivo Fabril|FAB|#0066b3|#ffffff|1|possession
ourense|UD Ourense|OUR|#e2001a|#111111|1|feu
realunion|Real Unión|RUN|#ffffff|#111111|1|contre
# Groupe 2
zaragoza|Saragosse|RZ|#ffffff|#1d3c8f|4|feu
huesca|Huesca|HUE|#1d3c8f|#a50044|4|bloc
cartagena|Carthagène|CAR|#111111|#ffffff|3|contre
gimnastic|Gimnàstic|NAS|#e2001a|#ffffff|3|pressing
hercules|Hércules|HER|#ffffff|#0055a4|3|feu
ibiza|Ibiza|IBI|#ffffff|#0055a4|3|possession
murcia|Real Murcia|MUR|#c8102e|#ffffff|3|physique
castilla|Real Madrid Castilla|RMC|#ffffff|#febe10|3|contre
alcorcon|Alcorcón|ALC|#ffd200|#1d3c8f|2|bloc
algeciras|Algeciras|ALG|#e2001a|#ffffff|2|aerien
atlmadrileno|Atlético Madrileño|ATB|#cb3524|#ffffff|2|bloc
jaen|Real Jaén|JAE|#ffffff|#6b2c91|2|feu
villarrealb|Villarreal B|VIB|#ffe667|#005187|2|possession
aguilas|Águilas|AGU|#e2001a|#ffffff|1|physique
antequera|Antequera|ANT|#00843d|#ffffff|1|contre
europa|CE Europa|EUR|#0055a4|#ffffff|1|possession
torremolinos|Juventud Torremolinos|JTO|#e2001a|#ffffff|1|pressing
majadahonda|Rayo Majadahonda|RMJ|#e2001a|#ffffff|1|aerien
santandreu|Sant Andreu|SAN|#e2001a|#ffd200|1|feu
teruel|Teruel|TER|#e2001a|#ffffff|1|bloc`
  },
  it: {
    1: `inter|Inter|INT|#0068a8|#111111|5|contre
napoli|Naples|NAP|#12a0d7|#ffffff|5|possession
juve|Juventus|JUV|#ffffff|#111111|5|bloc
milan|AC Milan|ACM|#fb090b|#111111|5|possession
atalanta|Atalanta|ATA|#1e71b8|#111111|4|pressing
roma|AS Rome|ROM|#8e1f2f|#f0bc42|4|feu
lazio|Lazio|LAZ|#87d8f7|#ffffff|4|contre
como|Côme|COM|#0055a4|#ffffff|4|possession
bologna|Bologne|BFC|#a21c26|#1a2f48|4|pressing
fiorentina|Fiorentina|FIO|#482e92|#ffffff|3|possession
torino|Torino|TOR|#8a1e03|#ffffff|3|physique
udinese|Udinese|UDI|#ffffff|#111111|3|physique
genoa|Genoa|GEN|#a8152d|#1d2f6f|2|feu
cagliari|Cagliari|CAG|#a50d32|#0d2350|2|bloc
lecce|Lecce|LEC|#ffe500|#e2001a|2|pressing
parma|Parme|PAR|#ffd200|#1d3c8f|2|contre
sassuolo|Sassuolo|SAS|#00843d|#111111|2|possession
monza|Monza|MON|#e2001a|#ffffff|2|bloc
frosinone|Frosinone|FRO|#ffd200|#0055a4|1|feu
venezia|Venise|VEN|#f58220|#00843d|1|contre`,
    2: `palermo|Palerme|PAL|#f5a7c4|#111111|4|feu
pisa|Pise|PIS|#111111|#0055a4|4|bloc
verona|Vérone|HVE|#ffdd00|#002a5c|4|contre
empoli|Empoli|EMP|#0055a4|#ffffff|4|possession
cremonese|Cremonese|CRE|#e2001a|#a0a0a0|4|physique
samp|Sampdoria|SAM|#1b5497|#ffffff|3|possession
modena|Modène|MOD|#ffd200|#1d3c8f|3|pressing
cesena|Cesena|CES|#ffffff|#111111|3|feu
catanzaro|Catanzaro|CTZ|#ffd200|#e2001a|3|contre
benevento|Benevento|BEN|#ffd200|#e2001a|3|aerien
mantova|Mantoue|MAN|#e2001a|#ffffff|3|possession
arezzo|Arezzo|ARE|#8a1538|#ffffff|2|bloc
ascoli|Ascoli|ASC|#111111|#ffffff|2|feu
avellino|Avellino|AVE|#00843d|#ffffff|2|pressing
carrarese|Carrarese|CAR|#ffd200|#1d3c8f|2|physique
juvestabia|Juve Stabia|JST|#ffd200|#1d3c8f|2|contre
padova|Padoue|PAD|#ffffff|#e2001a|2|possession
sudtirol|Südtirol|SUD|#ffffff|#e2001a|2|bloc
vicenza|Vicence|LRV|#e2001a|#ffffff|2|feu
entella|Virtus Entella|ENT|#6cace4|#ffffff|1|aerien`,
    3: `# Groupe A
cittadella|Cittadella|CIT|#8a1538|#ffffff|4|bloc
brescia|Union Brescia|UBR|#1d3c8f|#ffffff|4|possession
novara|Novara|NOV|#1d3c8f|#ffffff|3|contre
lecco|Lecco|LCO|#6cace4|#1d3c8f|3|feu
nextgen|Juventus Next Gen|JNG|#ffffff|#111111|3|pressing
trento|Trento|TRE|#ffd200|#0055a4|2|physique
arzignano|Arzignano|ARZ|#ffd200|#0055a4|2|bloc
treviso|Trévise|TRV|#ffffff|#1d3c8f|2|feu
albinoleffe|AlbinoLeffe|ALB|#6cace4|#ffffff|2|possession
alcione|Alcione Milano|ALC|#f58220|#1d3c8f|2|pressing
bellunesi|Dolomiti Bellunesi|DOL|#1d3c8f|#ffffff|2|aerien
vercelli|Pro Vercelli|PVE|#ffffff|#111111|2|contre
lumezzane|Lumezzane|LUM|#ffffff|#1d3c8f|2|physique
carpi|Carpi|CRP|#e2001a|#ffffff|2|feu
giana|Giana Erminio|GIA|#ffffff|#e2001a|2|bloc
renate|Renate|REN|#111111|#ffffff|2|contre
ospitaletto|Ospitaletto|OSP|#1d3c8f|#ffffff|1|pressing
desenzano|Desenzano|DES|#1d3c8f|#ffffff|1|aerien
pergolettese|Pergolettese|PER|#ffd200|#6cace4|1|possession
caratese|Folgore Caratese|FOL|#1d3c8f|#ffffff|1|physique
# Groupe B
spezia|La Spezia|SPE|#ffffff|#111111|4|possession
pescara|Pescara|PES|#ffffff|#1d9fe0|3|feu
perugia|Pérouse|PGA|#e2001a|#ffffff|3|pressing
reggiana|Reggiana|REG|#8a1538|#ffffff|3|contre
livorno|Livourne|LIV|#8a1538|#ffffff|3|feu
atalantau23|Atalanta U23|AU23|#1e71b8|#111111|3|pressing
campobasso|Campobasso|CBA|#e2001a|#1d3c8f|2|bloc
forli|Forlì|FOR|#e2001a|#ffffff|2|physique
gubbio|Gubbio|GUB|#e2001a|#6cace4|2|contre
ravenna|Ravenne|RAV|#e2001a|#ffd200|2|aerien
samb|Sambenedettese|SAMB|#e2001a|#0055a4|2|feu
torres|Torres|TRS|#e2001a|#1d3c8f|2|bloc
vispesaro|Vis Pesaro|VPE|#e2001a|#ffffff|2|possession
grosseto|Grosseto|GRO|#e2001a|#ffffff|1|physique
guidonia|Guidonia|GUI|#e2001a|#ffffff|1|contre
latina|Latina|LAT|#111111|#1d3c8f|1|bloc
ostiamare|Ostia Mare|OST|#e2001a|#ffffff|1|aerien
pianese|Pianese|PIA|#ffffff|#e2001a|1|possession
pineto|Pineto|PIN|#e2001a|#1d3c8f|1|pressing
vado|Vado|VAD|#e2001a|#1d3c8f|1|physique
# Groupe C
bari|Bari|BARI|#e2001a|#ffffff|4|aerien
catania|Catane|CAT|#1d3c8f|#e2001a|4|feu
salernitana|Salernitana|SAL|#8a1538|#ffffff|4|contre
cosenza|Cosenza|COS|#e2001a|#1d3c8f|3|physique
crotone|Crotone|CRO|#e2001a|#0055a4|3|possession
cerignola|Audace Cerignola|CER|#ffd200|#0055a4|2|pressing
casarano|Casarano|CSR|#e2001a|#0055a4|2|feu
casertana|Casertana|CAS|#e2001a|#ffffff|2|bloc
cavese|Cavese|CAV|#0055a4|#ffffff|2|contre
foggia|Foggia|FOG|#e2001a|#111111|2|pressing
interu23|Inter U23|IU23|#0068a8|#111111|2|possession
monopoli|Monopoli|MNP|#00843d|#ffffff|2|bloc
potenza|Potenza|POT|#e2001a|#0055a4|2|physique
savoia|Savoia|SAV|#ffffff|#1d3c8f|2|feu
altamura|Altamura|ALT|#e2001a|#ffffff|1|aerien
barletta|Barletta|BRL|#e2001a|#ffffff|1|contre
giugliano|Giugliano|GIU|#ffd200|#1d3c8f|1|physique
picerno|Picerno|PIC|#e2001a|#0055a4|1|bloc
scafatese|Scafatese|SCA|#e2001a|#ffd200|1|feu
sorrento|Sorrento|SOR|#e2001a|#ffd200|1|possession`
  },
  de: {
    1: `bayern|Bayern Munich|FCB|#dc052d|#ffffff|5|possession
leverkusen|Leverkusen|B04|#e32221|#111111|5|possession
dortmund|Dortmund|BVB|#fde100|#111111|5|feu
leipzig|Leipzig|RBL|#ffffff|#dd0741|4|pressing
stuttgart|Stuttgart|VFB|#ffffff|#e32219|4|contre
frankfurt|Francfort|SGE|#e1000f|#111111|4|feu
freiburg|Fribourg|SCF|#111111|#e2001a|3|bloc
hoffenheim|Hoffenheim|TSG|#1961b5|#ffffff|3|contre
mainz|Mayence|M05|#c3141e|#ffffff|3|pressing
gladbach|Mönchengladbach|BMG|#ffffff|#111111|3|possession
union|Union Berlin|FCU|#eb1923|#ffffff|3|physique
augsburg|Augsbourg|FCA|#ba3733|#46714d|2|bloc
bremen|Werder Brême|SVW|#1d9053|#ffffff|2|aerien
hamburg|Hambourg|HSV|#0a3f86|#ffffff|2|feu
koln|Cologne|KOE|#ffffff|#ed1c24|2|physique
schalke|Schalke 04|S04|#004d9d|#ffffff|2|feu
elversberg|Elversberg|SVE|#111111|#ffffff|1|contre
paderborn|Paderborn|SCP|#0055a4|#111111|1|pressing`,
    2: `wolfsburg|Wolfsburg|WOB|#65b32e|#ffffff|4|contre
heidenheim|Heidenheim|FCH|#e2001a|#0055a4|4|aerien
pauli|St. Pauli|FCSP|#6e3b1e|#ffffff|4|contre
hertha|Hertha Berlin|BSC|#005ca9|#ffffff|3|possession
bielefeld|Arminia Bielefeld|DSC|#0055a4|#111111|3|feu
bochum|Bochum|BOC|#005ca9|#ffffff|3|physique
darmstadt|Darmstadt|D98|#0055a4|#ffffff|3|bloc
hannover|Hanovre|H96|#00843d|#111111|3|bloc
kaiserslautern|Kaiserslautern|FCK|#e2001a|#ffffff|3|feu
kiel|Holstein Kiel|KSV|#0055a4|#e2001a|3|pressing
nurnberg|Nuremberg|FCN|#a50a2f|#111111|3|physique
braunschweig|Brunswick|EBS|#ffd200|#0055a4|2|feu
cottbus|Energie Cottbus|FCE|#e2001a|#ffffff|2|physique
dresden|Dynamo Dresde|SGD|#ffd200|#111111|2|feu
furth|Greuther Fürth|SGF|#00843d|#ffffff|2|possession
karlsruhe|Karlsruhe|KSC|#00439c|#ffffff|2|aerien
magdeburg|Magdebourg|FCM|#0055a4|#ffffff|2|pressing
osnabruck|Osnabrück|OSN|#6b2c91|#ffffff|1|contre`,
    3: `dusseldorf|Düsseldorf|F95|#e2001a|#ffffff|4|pressing
duisburg|Duisbourg|MSV|#1d4f91|#ffffff|3|physique
essen|Rot-Weiss Essen|RWE|#e2001a|#ffffff|3|feu
ingolstadt|Ingolstadt|FCI|#111111|#e2001a|3|possession
munster|Preußen Münster|SCP|#00843d|#111111|3|bloc
regensburg|Jahn Ratisbonne|SSV|#e2001a|#ffffff|3|contre
rostock|Hansa Rostock|HRO|#ffffff|#004a99|3|feu
saarbrucken|Sarrebruck|FCS|#1d3c8f|#111111|3|bloc
wiesbaden|Wehen Wiesbaden|SVWW|#e2001a|#111111|3|pressing
aachen|Aix-la-Chapelle|AAC|#ffd200|#111111|2|feu
hoffenheim2|Hoffenheim II|TSG2|#1961b5|#ffffff|2|possession
fortunakoln|Fortuna Cologne|SCF|#e2001a|#ffffff|2|physique
viktoria|Viktoria Cologne|VIK|#e2001a|#ffffff|2|contre
mannheim|Waldhof Mannheim|SVW|#1d3c8f|#111111|2|aerien
meppen|Meppen|SVM|#0055a4|#ffffff|2|bloc
stuttgart2|Stuttgart II|VFB2|#ffffff|#e32219|2|possession
verl|Verl|SCV|#111111|#ffffff|2|pressing
wurzburg|Würzburger Kickers|FWK|#e2001a|#ffffff|2|feu
grossaspach|Großaspach|SGS|#111111|#ffffff|1|physique
havelse|TSV Havelse|HAV|#e2001a|#ffffff|1|aerien`
  }
};
// clubs qui ne jouent plus dans les trois divisions (gardés pour les anciennes sauvegardes)
const CLUBS_HORS = [
  { id: 'chateauroux', nom: 'Châteauroux', court: 'LBC', c1: '#1d3c8f', c2: '#ffffff', pays: 'fr', force: 0.46, style: 'aerien' },
  { id: 'besancon', nom: 'Besançon', court: 'RB', c1: '#1d3c8f', c2: '#ffffff', pays: 'fr', force: 0.4, style: 'pressing' },
  { id: 'es-salamanca', nom: 'Salamanque', court: 'USA', c1: '#ffffff', c2: '#111111', pays: 'es', force: 0.46, style: 'physique' },
  { id: 'es-recre', nom: 'Recreativo Huelva', court: 'REC', c1: '#ffffff', c2: '#005ca9', pays: 'es', force: 0.44, style: 'aerien' },
  { id: 'it-ternana', nom: 'Ternana', court: 'TER', c1: '#e2001a', c2: '#00843d', pays: 'it', force: 0.56, style: 'physique' },
  { id: 'it-triestina', nom: 'Triestina', court: 'TRI', c1: '#e2001a', c2: '#ffffff', pays: 'it', force: 0.5, style: 'aerien' },
  { id: 'de-m1860', nom: 'Munich 1860', court: 'TSV', c1: '#6cace4', c2: '#ffffff', pays: 'de', force: 0.58, style: 'possession' }
];
CLUBS.length = 0;
Object.entries(DONNEES_LIGUES).forEach(([pays, divs]) => Object.entries(divs).forEach(([div, txt]) => {
  let g = null, groupes = 0;
  txt.split('\n').forEach(l => {
    l = l.trim(); if (!l) return;
    if (l.startsWith('#')) { groupes++; g = String(groupes); return; }
    const [id, nom, court, c1, c2, f, style] = l.split('|');
    const base = 0.35 + 0.15 * (+f - 1), h = [...id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    CLUBS.push({ id: pays === 'fr' ? id : pays + '-' + id, nom, court, c1, c2, div: +div, g, pays, force: Math.round((base + ((h % 7) - 3) * 0.01) * 100) / 100, style: style || Object.keys(STYLES)[h % 7] });
  });
}));
CLUBS_HORS.forEach(c => CLUBS.push({ ...c, div: 0, g: null }));
CLUB_MAP = null;
