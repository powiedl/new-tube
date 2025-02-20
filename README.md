# NewToobe

This will become a little YouTube clone (I think you already guessed this based on the name). And it is "heavily" based on a YouTube video - [Ultimate Next 15 Course: Build a YouTube Clone (2025)](https://www.youtube.com/watch?v=ArmPzvHTcfQ)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## drizzle

Drizzle ist ein ORM Package - ähnlich wie prisma. Es bietet aber die Möglichkeit neben den "üblichen" Modellbefehlen zur Manipulation der Daten in der Datenbank auch SQL ähnliche Befehle zu verwenden. Daher verwendet der Trainer in diesem Tutorial Drizzle.

### Installation

```
bun add drizzle-orm@0.39.0 @neondatabase/serverless@0.10.4 dotenv@16.4.7
bun add -D drizzle-kit@0.30.3 tsx@4.19.2
```

### Einrichtung

In den Environment Variablen muss man die passende DATABASE_URL hinterlegen (im Fall von PostgreSQL auf neon.tech: `DATABASE_URL=postgres://neondb_owner:...@...aws.neon.tech/neondb?sslmode=require`). Dann legt man in **/src** einen Ordner **/db** an. In diesem legt man eine **index.ts** mit folgendem Inhalt an:

```
import { drizzle } from 'drizzle-orm/neon-http';
export const db = drizzle(process.env.DATABASE_URL!);
```

Und daneben eine **schema.ts** (in dieser Datei werden die Datenbankschema definiert):

```
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').unique().notNull(),
    name: text('name').notNull(),
    // TODO: add banner fields
    imageUrl: text('image_url').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('clerk_id_idx').on(t.clerkId)]
);
```

Dieses Beispiel legt eine **users** Tabelle an. Diese hat die Spalten:

- id: eine uuid, auch der primary Key `primaryKey()` und wird standardmäßig zufällig generiert
- clerkId: ein string und die id, die der User in clerk hat (in der Tabelle wird er in der Spalte `clerk_id` gespeichert) - eindeutig, `unique()` und verpflichtend `notNull()`
- name: ein string und verpflichtend
- imageUrl: ein string und verpflichtend
- createdAt: ein Zeitstempel, standardmäßig der aktuelle Zeitpunkt `defaultNow()` und verpflichtend
- updatedAt: ein Zeitstempel, standardmäßig der aktuelle Zeitpunkt und verpflichtend

Außerdem wird ein zusätzlicher Index clerk_id_idx angelegt, der über die Spalte clerkId geht. Damit kann man schneller den Datensatz zu einer bestimmten clerkId finden (dafür ist das Einfügen und Löschen eines Users etwas aufwändiger (passiert für den Entwickler transparent im Hintergrund) als wenn es keinen zusätzlichen Index gäbe (weil eben der Index ebenfalls gepflegt werden muss).

Dann muss man noch eine **drizzle.config.ts** im root des Projekts mit diesem Inhalt anlegen:

```
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out:'./drizzle',
  schema:'./src/db/schema.ts',
  dialect:'postgresql',
  dbCredentials:{
    url:process.env.DATABASE_URL!,
  },
});
```

Damit legt man fest, wo drizzle das Ergebnis speichern soll, wo das Schema zu finden ist, welche Datenbank (und damit welcher SQL-Dialekt) verwendet wird und ebenfalls werden die Credentials übermittelt (die aus der URL extrahiert werden).

### Modelländerungen in die Datenbank migrieren

Im Moment weiß die Datenbank noch nichts von unserem users Modell bzw der anzulegenden Tabelle users. Damit sich das ändert, muss man die Änderungen in der Datenbank anwenden. Am einfachsten geht das mit `bunx drizzle-kit push`. In der [Drizzle Dokumentation](https://orm.drizzle.team/docs/get-started/neon-new) stehen im [Schritt 6 "Applying changes to the database"](https://orm.drizzle.team/docs/get-started/neon-new#step-6---applying-changes-to-the-database) alternative Möglichkeiten beschrieben (der "übliche" generate und migrate Weg)

### Drizzle Studio

Drizzle bietet ein Studio (ähnlich wie Prisma). Damit kann man lokal die Datenbank ansehen und analysieren. Man startet das Studio mit diesem Befehl `bunx drizzle-kit studio` und danach erreicht man es über diese [URL](https://local.drizzle.studio/).

### Drizzle - automatisch zod Schemata für Tabellen anlegen

Man kann mit dem Package `drizzle-zod` automatisch zodSchemata für Tabellen, die man über drizzle verwaltet, erzeugen. Dazu hat diese Paket drei Funktionen `createInsertSchema`, `createUpdateSchema` und `createSelectSchema`. Alle drei Funktionen erwarten als Parameter das entsprechende Drizzle Modell für das ein Schema erzeugt werden soll. Normalerweise ruft man die entsprechend benötigten Methoden nach der Tabellendefinition im `schema.ts` auf und exportiert ihr Ergebnis.

### Drizzle - Vergleichsoperatoren

Drizzle kommt auch mit einer Menge Vergleichsoperatoren bzw. sollte man besser Vergleichsfunktionen sagen. Beispiele sind `eq` (prüft ob die beiden Parameter gleich sind), `inArray` (prüft ob das zweite Array im ersten enthalten ist). `ilike` prüft auf "Teilstrings", das Wildcardzeichen ist SQL typisch `%`. Das i steht für case insensitive, will man die Groß-/Kleinschreibung beachten lässt man einfach das führende i weg (also `like`).

### Beziehungen zwischen Tabellen

Man kann mit Drizzle auch Beziehungen zwischen Tabellen herstellen. Dazu sind mehrere Dinge notwendig.

#### In der "Childtabelle" eine Referenz auf die "Parenttabelle" eintragen

```
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
```

Damit richtet man einen Verweis auf die Tabelle users ein (bzw. auf das Modell users). Man legt fest, dass in der Spalte user_id (die im Modell als userId angesprochen wird) ein Verweis auf das Attribut id aus dem Modell users gespeichert wird. In den Optionen gibt man an, was passieren soll, wenn der Datensatz in der Parenttabelle gelöscht wird (mit `cascade` werden die referenzierten Datensätze in der Childtabelle ebenfalls gelöscht).

#### Ein Relation-Objekt erzeugen

Zusätzlich "muss" noch ein separates Relation-Objekt erzeugt werden (zwingend erforderlich ist dies nur, wenn man - auch - Relational Queries - verwenden will). Wenn man nur SQL Queries verwendet, kann man sich diesen Schritt sparen (es empfiehlt sich aber, diesen Schritt immer zu machen, weil vielleicht will man "morgen" auch Relational Queries in seiner App verwenden).

Außerdem kann man in einer reinen SQL Applikation "unschöne" Spaltennamen in den Tabellen bekommen, wenn man eine Beziehung auf die gleiche Tabelle erstellt - siehe [Ein Relation-Objekt auf die gleiche Tabelle](#Ein Relation-Objekt auf die gleiche Tabelle) erzeugen.

```
export const videoRelations =relations(videos,({one}) => ({
  user:one(users, {
    fields:[videos.userId],
    references:[users.id]
  })
}))
```

Der Grund, warum es diese "Doppelanlage" braucht ist, weil Drizzle zwischen Foreign Keys und Relations unterscheidet. Ein Foreign Key wird in der Datenbank selbst angelegt und die Datenbank ist dafür verantwortlich, dass diese immer erfüllt sind (wenn man etwas macht, was diese Foreign Keys bricht, wirft die Datenbank einen Fehler).

Im Gegensatz dazu sind Relations nur in der Applikation vorhanden - sie spiegeln sich nicht in der Datenbank wider. Aus diesem Grund muss man sie in der Applikation "extra" definieren. Man kann Relations und Foreign Keys nebeneinander verwenden. Wenn man Relations im Schema verändert und dann ein `drizzle-kit push` ausführt, führt das zu keinen Änderungen an der Datenbank, d. h. die Datenbank "weiß" nichts von diesen Relations. Vielleicht braucht man auch keine Relations, wenn man keine relational Queries benutzt (sondern nur select mit joins) - aber das ist nur die Vermutung vom Vortragenden.

Weiterführende Details siehe die Dokumentation von Drizzle zum Thema [Relations](https://orm.drizzle.team/docs/relations) (ein Unterpunkt sind dort die Foreign Keys).

#### In einem Relation-Objekt mehrmals auf die gleiche Tabelle verweisen

Damit man da den Spaltennamen bestimmen kann, muss man zwei Dinge machen. Man muss der Relation einen Namen geben:

```
export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  viewerId: one(users, {
    fields: [subscriptions.viewerId],
    references: [users.id],
    relationName: 'subscriptions_viewer',
  }),
  creatorId: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: 'subscriptions_creator',
  }),
}));
```

Und man muss bei den Relations des betreffenden Modells (im Beispiel `users`) diesen relationName ebenfalls angeben:

```
export const userRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  videoViews: many(videoViews),
  videoReactions: many(videoReactions),
  subscriptions: many(subscriptions, {
    relationName: 'subscriptions_viewer',
  }),
  subscribers: many(subscriptions, {
    relationName: 'subscriptions_creator',
  }),
}));
```

Damit erhalten die Spalten dann im `users` Modell den angegebenen Namen - eben `subscriptions` und `subscribers`.

#### In einer Tabelle eine Referenz auf die gleiche Tabelle machen (rekursive Referenz), z.b. Parentbeziehungen

Wenn man einfach nur ein `.references()` auf die gleiche Tabelle angibt, führt das zu einem Typescriptfehler. Die Lösung dafür ist entweder, der Referenzfunktion einen entsprechenden Rückgabewert zu geben (`AnyPgColumn`) oder den foreign key auf die eigene Tabelle als "Index"funktion anzugeben. Hier ein Beispiel für die Comments aus dem Programm:

```
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    videoId: uuid('video_id')
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),
    parentId: uuid('parent_id'),
    value: text('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => {
    return [
      foreignKey({
        columns: [t.parentId],
        foreignColumns: [t.id],
        name: 'comments_parent_id_fkey',
      }).onDelete('cascade'),
    ];
  }
);
```

Darin wird ein foreignKey (diese Funktion muss man von `drizzle-orm/pg-core` importieren - für PostgreSQL Datenbanken) `comments_parent_id_fkey` definiert. Dieser besteht aus der Spalte `parentId` und der Fremdschlüssel ist die `id` (ebenfalls aus der comments Tabelle). Man speichert also immer den eventuell vorhanden direkten Parent ab - weil jeder Comment nur einen Parent, aber viele Childs haben kann.

Mit dem onDelete legt man fest, dass beim Löschen eines Parent comments auch alle Child comments gelöscht werden sollen - eine alternative wäre es, die parentId der Child comments auf die parentId des gelöschten comments zu ändern (aber das wäre aufwändiger und es ist fraglich, ob die Kommentare zum darüberliegenden "passen" oder ob das nicht für mehr Verwirrung sorgen würde).

### Joins in Drizzle

Man kann in Drizzle auch Joins über mehrere Tabellen machen. Dazu gibt es die Methoden `.innerJoin`, `.leftJoin`, `.rightJoin` und `.outerJoin`. Diese werden nach dem from() verwendet und erwarten 2 Parameter, nämlich das zu verknüpfende Modell und die Bedingungen, die gelten müssen, damit die beiden Datensätze als "zusammengehörend" betrachtet werden.

```
  .from(videos)
  .innerJoin(users, eq(videos.userId, users.id))
```

Im Beispiel wird das users Modell zum videos Modell dazugejoined und es gehören jene Datensätze zusammen, wo die id Spalte im users Modell mit der userId Spalte im videos Modell gleich ist.

Will man dann auch aus beiden Tabellen Spalten im Ergebnis haben, muss man dies im select schreiben. Dabei kann man explizit einzelne Spalten nehmen oder alle (aber für alle muss man überdie Funktion `getTableColumns` gehen):

```
  .select({
    ...getTableColumns(videos),
    user: {
      ...getTableColumns(users),
    },
    userName:users.name,
  })
```

Im Beispiel werden alle Informationen von dem passenden User unter einem Attribut zusammengefasst. Ich habe (sinnloserweise, aber als Referenz) auch angegeben wie man nur den name als userName zur Verfügung stellt.

### Kombinierter Primary Key in Drizzle

Manchmal ist es notwendig, dass man einen Primary Key über mehrere Spalten bildet, d. h. erst die Kombination dieser Spalten zusammen ist eindeutig. Das kann man bei der Definition des Schemas erreichen, indem man als weiteren Parameter eine entsprechende Callback Funktion angibt. Diese Funktion erhält als ersten Parameter die Tabelle. Diese muss ein Array liefern, in dem die Funktion primaryKey aufgerufen wird. Diese Funktion wiederum erwartet ein Objekt als Parameter. Dieses Objekt hat einerseits das Attribut name (das wird der Name des Primary Keys) und andererseits ein Attribut columns, welches ein Array ist. Der Inhalt dieses Arrays sind die Spalten die den Primary Key bilden sollen. Im folgenden ein Beispiel, dass einen Primary Key über die Spalten userId und videoId anlegt (bei diesen Spalten handelt es sich um Referenzen auf die Modelle users und videos):

```
export const videoViews = pgTable(
  'video_views',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    videoId: uuid('video_id')
      .references(() => videos.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ name: 'video_views_pk', columns: [t.userId, t.videoId] }),
  ]
);
```

Will man dann beispielsweise zählen, wie oft ein video angesehen wurde, kann man `db.$count(videoViews,eq(videoViews.videoId,videos.id))` verwenden. Bei dem Beispiel ist in videos.id die id des gerade "interessanten" Videos gespeichert (es ist ein Teil der getOne Procedure im videos modules - `src/modules/videos/server/procedures.ts`). Dieses Vorgehen erspart eine Subquery, trotzdem sollte man es nur in so einfachen Fällen, wo man eben alle Vorkommen in einer anderen Tabelle zählen will (die einer einfachen Bedingung genügen).

### Common Table Expressions (CTE)

Man kann mit drizzle auch CTEs erstellen. Dazu verwendet man die `db.$with` Methode. Diese erwartet einen Parameter (den Namen der CTE). Und das Ergebnis davon hat selbst wieder die Methode `as`, der man die eigentliche Query der CTE übergibt. Die Methode `as` erwartet dann als Parameter ein `db` Objekt mit einer `select` Methode. Danach kann man diese CTE in einem nachfolgenden db Statement wie eine andere Tabelle verwenden.

Im folgenden ein Beispiel wo man über eine CTE die Reaktion des aktuellen Benutzers (in der Variable `userId` gespeichert) ermittelt. Das verwendet man dann, damit man diese Information (like oder dislike oder gar keine Reaktion des aktuellen Users auf das aktuelle Video) zurückgeben kann, damit die GUI das entsprechend darstellen kann.

```
const viewerReactions = db.$with('viewer_reactions').as(
  db
    .select({
      videoId: videoReactions.videoId,
      type: videoReactions.type,
    })
    .from(videoReactions)
    .where(inArray(videoReactions.userId, userId ? [userId] : []))
);
```

Und hier ein Beispiel, wie man das dann benützt, um eine eventuelle Reaktion des aktuellen Benutzers zurückzuliefern. Dabei muss man die CTE mittels der Methode `with` "einbinden":

```
const [existingVideo] = await db
  .with(viewerReactions)
  .select({
    ...getTableColumns(videos),
    user: { ...getTableColumns(users) },
    viewerReaction:viewerReactions.type,
  })
  .from(videos)
  .innerJoin(users, eq(videos.userId, users.id))
  .leftJoin(viewerReactions, eq(videos.id, viewerReactions.videoId)) // viewerReactions only contains the reaction of the current user!
  .where(eq(videos.id, input.id));
```

### Drizzle "Upsert"

PostgreSQL bietet eine `ON CONFLICT` clause an (was soll passieren, wenn man einen Datensatz einfügen will, dessen Primary Key bereits existiert). Im Normalfall verwendet man das eben bei einem INSERT - und die Konfliktlösung ist dann zumeist ein UPDATE statt dessen zu machen (daher kommt auch der zusammengesetzte Name upsert).

Mit drizzle kann man das mit den onConflictDo... Methoden machen - und die "Upsert"-Methode ist `onConflictDoUpate`. Die erwartet ein Objekt mit zwei Attributen - `target` - ein Array der Felder die bei Gleichheit als "Konflikt" betrachtet werden (zumeist die Felder, die den primary Key bilden) und `set` - ein Objekt mit den Feldnamen als Attribut und ihren jeweiligen Werten als Attributwert. Im folgenden ein Beispiel, wo der type einer Reaktion auf ein Video auf like geändert wird, falls bereits eine Reaktion für dieses Video vorliegt:

```
const [createdVideoReaction] = await db
  .insert(videoReactions)
  .values({ userId, videoId, type: 'like' })
  .onConflictDoUpdate({
    // needed, if the user disliked the video before - we could also change the delete above to delete every reaction of the user to the video
    target: [videoReactions.userId, videoReactions.videoId],
    set: {
      type: 'like',
    },
  })
```

## [ngrok](https://dashboard.ngrok.com)

Dabei handelt es sich um ein verteiltes Reverse Proxy System (damit ein Service aus dem Internet den Dienst am lokalen eigenen Computer verwenden kann). Ein Vorteil von ngrok gegenüber anderen vergleichbaren Lösung, ist die Tatsache, dass man eine statische Domäne dafür bekommt, d. h. ein unerveränderlicher Endpunkt, mit dem das Internet die lokal laufende Instanz am eigenen Computer erreichen kann.

### Einrichtung

1. Man muss sich auf der Seite einen Account anlegen (dabei kann man sich beispielsweise über Github anmelden).
2. Dann muss man das (zum eigenen Betriebssystem) passende ngrok executeable installieren oder herunterladen.
3. Dann muss man seine Domäne erstellen (Domains / Create Domain - auf der Webseite von ngrok)
4. Dann muss man eine Konfiguration für ngrok anlegen. Für Windows wird dazu ein File mit diesem Inhalt im eigenen AppData/Local/ngrok/ngrok.yaml mit diesem Inhalt benötigt:

```
version: "3"
agent:
    authtoken: 5gf...V2I
```

### Verwendung

Dann kann man ngrok starten `ngrok http --url=das-ist-die-url-die-man-von-ngrok-bekommen-hat.ngrok-free.app 3000`. Die 3000 am Ende sind der lokale Port auf dem die eigene Anwendung am eigenen Computer läuft, die man aus dem Internet erreichbar machen will.

Wenn man das executeable nicht im Pfad gespeichert hat muss man gegebenenfalls noch den Pfad zum executeable angeben.

Wenn das Kommando einen Fehler meldet, dass die Domäne nicht existiert (diese aber die richtige ist), kann man --domain statt --url probieren.

Damit ist die Webseite von Newtoobe über die URL, die man bei ngrok angegeben hat, aus dem Internet erreichbar.

## concurrently

Der Nachteil von diesem Setup ist, dass man jetzt immer beides (`ngrok http --url=... 3000` und `bun run dev`) ausführen muss. Um sich das zu ersparen kann man das Package concurrently verwenden - einfach && bei der entsprechenden script Zeile in package.json hilft nicht, weil dann das zweite Kommando erst ausgeführt wird, wenn das erste beendet wurde - und wir müssen wirklich beide Kommandos parallel laufen haben.

### Installation (für das Tutorial wird die Version auf 9.1.2 fixiert)

```
bun add -D concurrently@9.1.2.
```

### Einrichtung

In package.json muss man jetzt noch die scripts Sektion wie folgt anpassen:

```
    "dev:all": "concurrently \"bun run dev:webhook\" \"bun run dev\" ",
    "dev": "next dev",
    "dev:webhook": "./ngrok http --url=jawfish-meet-separately.ngrok-free.app 3000",
```

Und dann kann man beides gemeinsam mit `bun run dev:all` starten.

## Clerk Webhook einrichten

Jetzt können wir in Clerk den Webhook einrichten, damit Clerk uns informieren kann, wenn ein neuer User angelegt wird (eben über die mit ngrok eingerichtete Domäne).

1. Im Clerk Dashboard auf Configure - Webhooks gehen.
2. **Add Endpoint** anklicken
3. als Endpoint URL die URL, die man beim ngrok Kommando angegeben hat, eintragen (zusätzlich `https://` davor!) und am Ende dann ergänzt um die relative URL für den Endpunkt (bei NewToobe kommt noch `/api/users/webhook` dazu)
4. Man kann eine Beschreibung für den Endpunkt angeben (Damit man auch auf der Clerk Seite erkennt, wofür der verwendet wird) - aber nicht notwendig.
5. Dann muss man die Events auswählen, über die einen Clerk über den Webhook notifizieren soll (bei uns alle user Events - 4 Stück)
6. **Create** anklicken
7. Das Signing Secret kopieren und gut aufheben (aber nicht exposen!) - das wird später benötigt (beispielsweise in .env.local als `CLERK_SIGNING_SECRET` speichern, **NICHT** `NEXT_PUBLIC_CLERK_SIGNING_SECRET` - weil so würde es zum Client exposed werden!)
8. In der Clerk Dokumentation findet man dann unter [Sync Clerk data to your apps with webhooks](https://clerk.com/docs/webhooks/sync-data) eine Beschreibung, was man tun muss, damit man die Daten, die man per Webhook mitgeteilt bekommt, richtig verarbeiten kann.

### Clerk - zusätzliche Optionen im Userbutton Dropdown anzeigen

Mit Clerk ist es sehr einfach zusätzliche Optionen im Userbutton Dropdown anzuzeigen. **Dazu ist es notwendig, dass der UserButton in einer Client-Komponente verwendet wird** (ansonsten bekommt man einen Fehler)!

Hier ein Beispiel wie man den Link zu `/studio` im Userbutton mit aufnimmt (weil der Userbutton innerhalb von `<SignedIn>` verwendet wird, sieht man den Eintrag nur, wenn man angemeldet ist):

```
<SignedIn>
  <UserButton>
    <UserButton.MenuItems>
      <UserButton.Link label='Studio' href='/studio' labelIcon={<ClapperboardIcon className='size-4'>} />
    </UserButton.MenuItems>
  </UserButton>
</SignedIn>
```

Man kann auch die Reihenfolge der "Standard"-Einträge verändern, dazu muss man sie als UserButton.Action an der richtigen Stelle einfügen. Wenn man den Manage account Eintrag am Ende haben will, fügt man im vorigen Beispiel die Zeile `<UserButton.Action label='manageAccount'>` nach dem `<UserButton.Link label='Studio'... />` ein.

Auszug aus der Doku von Clerk bzgl. der Labels für die Standard Aktionen:

> The <UserButton /> component includes two default menu items: Manage account and Sign out, in that order. You can reorder these default items by setting the label prop to 'manageAccount' or 'signOut'. This will target the existing default item and allow you to rearrange it.

## [tRPC](https://trpc.io)

Mit tRPC kann man typisierte API-Calls ausführen. Mit der Version 11, die erst in Kürze als offizielle Version erscheinen wird, kann man authoriziertes Prefetching machen (d. h. man kann Daten für einen bestimmten Benutzer am Server prefetchen, das geht mit der in NextJS integrierten Variante nicht). Dafür muss man jetzt mit den Versionen mehr aufpassen.

Die Anleitung wenn man NextJS App Router verwendet, findet man [hier](https://trpc.io/docs/client/react/server-components).

Mit dem folgenden Befehl werden die notwendigen Pakete in der richtigen (gleich wie der Vortragende) Version installiert:

```
bun add @trpc/server@11.0.0-rc.730 @trpc/client@11.0.0-rc.730 @trpc/react-query@11.0.0-rc.730 @tanstack/react-query@5.65.1 zod client-only server-only
```

### Beispiel

Nachdem man die ganze Installationsanleitung befolgt hat, kann man sich das prefetch ansehen ... Dazu erstellt man unterschiedliche Versionen von app/(home)/page.tsx

#### Client Komponente

Zuerst die Version als Client Komponente ("langsam", dafür mit Interaktivität möglich - im Beispiel wird das nicht wirklich genutzt - nur der useQuery Hook).

```
// Implementation as client ... interactivity possible
'use client';
import { trpc } from '@/trpc/client';

export default function Home() {
  const { data } = trpc.hello.useQuery({ text: 'powidl2' });
  return <div>Client component says: {data?.greeting} </div>;
}
```

#### Server Komponente

Dann die Version als Server Komponente ("schnell", dafür ist keine Interaktivität möglich):

```
import { trpc } from '@/trpc/server';
export default async function Home() {
  const data = await trpc.hello({ text: 'powidl' });
  return <div>Client component says: {data.greeting} </div>;
}
```

Und dann letzten Endes die "Mischung". Dabei werden in der Server Komponente die Daten prefetched und dann werden sie an eine Client Komponente übergeben:

#### Mischung - sowohl SERVER- als auch Clientkomponente

```
import { HydrateClient, trpc } from '@/trpc/server';
import { PageClient } from './client';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

export default async function Home() {
  void trpc.hello.prefetch({ text: 'powidl' });
  return (
    <HydrateClient>
      <Suspense fallback=<p>Loading...</p>>
        <PageClient />
      </Suspense>
    </HydrateClient>
  );
}
```

#### Mischung - sowohl Server- als auch CLIENTkomponente

```
'use client';
import { trpc } from '@/trpc/client';

export const PageClient = () => {
  const [data] = trpc.hello.useSuspenseQuery({ text: 'Powidl' });
  return <div>Pageclient says: {data.greeting}</div>;
};
```

Wichtig ist, dass das `'use client';` bei der Clientkomponente angegeben wird, weil VSCode `trpc.hello.useSuspenseQuery({ text: 'Powidl' });` nicht als Verwendung eines Hooks erkennt und daher nicht darauf aufmerksam macht, wenn das `'use client'` fehlt.

### Takeaways für den "gemischten" Ansatz in tRPC

Immer wenn man ein `useSuspenseQuery` in der Client Komponente verwendet, muss man auch in der Server Komponente das passende `prefetch` verwenden.

Wenn man Daten in `useSuspenseQuery` übergibt, muss man die gleichen Daten auch in `prefetch` verwenden.

Außerdem muss man bei der Server Komponente `export const dynamic = 'force-dynamic'` verwenden (Weil die Bundler nicht erkennen, dass das prefetch etwas dynamisches ist und daher versuchen eine statische Seite zu rendern - was zu Buildfehlern führt).

Man kann auch mehrere unabhängige Dinge prefetchen (z.b. ein bestimmtes Video und alle Kategorien - wie wir es im Formular zum Ändern der Videodetails machen).

Prefetching funktioniert nicht in Layout-Files! - und damit auch nicht in Komponenten, die in Layoutfiles verwendet werden.

### tRPC Context (createTRPCContext in `init.ts`)

Der Kontext wird für jeden einzelnen API Request ausgeführt, daher sollte er so "schlank" wie möglich sein. Es ist also keine gute Idee beispielsweise eine Datenbankabfrage in den Kontext aufzunehmen. Wenn man beispielsweise wissen will, wer der User ist (von Clerk) kann man so vorgehen:

```
export const createTRPCContext = cache(async () => {
  const { userId } = await auth(); // das macht keinen Call irgendwohin, sondern holt die Information aus dem JWT-Token, der als Header bereits vorliegt, daher ist es "fein"
  return {clerkUserId: userId };
});
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
```

Nach dem createTRPCContext exportiert man noch den type des Contexts und bei `initTRPC.context<Context>().create({...})` verwendet man den Kontext, damit dieser auch erzeugt wird.

Und dann kann man in der API-Route im query über `opts.ctx.` auf den Kontext zugreifen:

```
export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      console.log('ClerkUserId', opts.ctx.clerkUserId);
      return {
        greeting: `hello ${opts.input.text} - for clerkUserId ${opts.ctx.clerkUserId}`,
      };
    }),
});
```

### tRPC Protected Route festlegen

Man kann noch einen Schritt weiter gehen und eine "Schablone" für eine protected Route festlegen. Dann kann man in weiterer Folge immer diese Schablone verwenden, wenn man eine protected Route benötigt:

```
export const protectedProcedure = t.procedure.use(async function isAuthed(
  opts
) {
  const { ctx } = opts;

  if (!ctx.clerkUserId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return opts.next({
    ctx: { ...ctx },
  });
});
```

Dann muss man bei

```
export const appRouter = createTRPCRouter({
  hello: baseProcedure...
```

eben nur protectedProcedure verwenden:

```
export const appRouter = createTRPCRouter({
  hello: protectedProcedure...
```

### Verfeinerung des gemischten Ansatzes

Die Serverkomponente wird nur für das prefetchen der Daten verwendet. Außerdem wird genau an dieser Stelle die HydrateClient Komponente verwendet. Dieses "strikte" Verbinden von `trpc. ... .prefetch();` und <HydrateClient><ViewKomponente /></HydrateClient> reduziert die Wahrscheinlichkeit, dass man auf das HydrateClient vergisst, wenn man prefetch verwendet.

Die ViewKomponete ist eine reine Darstellungskomponente, die sogar nur die gesamte Seite in einzelne Sections unterteilt. Die Sections sind dann die Clientkomponente des gemischten Ansatzes. Und weil die Client-Komponente, wo der `trpc. ... .useSuspenseQuery();` Hook verwendet wird, in ein `<Suspense><ErrorBoundary>`...`</ErrorBoundary></Suspense>` gekapselt werden muss, wird die Client Komponente in zwei Teile zerlegt:

#### Die exportierte Client Komponente ...Section

```
'use client';
import { trpc } from '@/trpc/client';
import { ErrorBoundary } from 'react-error-boundary'; // auf diesen Import achten, der automatische Import will eine andere ErrorBoundary importieren!
import { Suspense } from 'react';

interface CategoriesSectionProps {
  categoryId?: string;
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<p>Loading ...</p>}>
      <ErrorBoundary fallback={<p>Error ...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};
```

#### Die eigentliche Clientkomponente mit dem useSuspenseQuery()

```
const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  return <>...</>;
};
```

Dabei werden beide Komponenten in der gleichen Datei gespeichert, aber eben nur die "äußere" exportiert.

Mit diesem Ansatz kann man relativ leicht kontrollieren ob alles passt:

1. Die Serverkomponente lädt die Daten mit `.prefetch()`
2. In der Serverkomponente enthält `<HydrateClient>...</HydrateClient>`
3. Die View Komponente erfüllt keine besonderen Voraussetzungen. Sie enthält im Return nur diverse Sections (und das "Layout" für die Sections untereinander)
4. Die Client Komponente (die einzelnen Sections) enthalten jeweils das `'use client';`
5. Die Client Komponente besteht eigentlich aus zwei Komponenten
6. Die exportiere Komponente, enthält im return den `<Suspense>` und `<ErrorBoundary>` (Achtung: von 'react-error-boundary' importiert!)
7. Die "richtige" Client Komponente wird so wie die exportierte Client Komponente mit anschließendem Suspense genannt, d. h. für die CategorySection ist die "richtige" Client Komponente (die aber **nicht** exportiert wird, sondern nur innerhalb der Datei für die Clientkomponente ansprechbar ist) heißt diese CategorySectionSuspense.
8. In dieser Suspense Komponente wird der useSuspenseQuery Hook verwendet.

Wichtig ist nur, dass auch hier die Queries in der Server Komponente und der Client Komponente übereinstimmen. Man kann den Client Teil auch auf mehrere Client Komponenten aufteilen. Dann muss nur jeder Client Teil sein eigenes

Wenn man einen Fehler **Switched to client rendering because the server rendering errored UNAUTHORIZED** erhält, kann es beispielsweise sein, dass man in der Serverkomponente (Page) das `.prefetch()` vergessen hat.

Wenn man mehrere (unabhängige) Dinge prefetched und diese in unterschiedlichen Client Komponenten verwenden will, ist es wichtig, dass jede Client Komponente ihr eigenes `<Suspense>` und `<ErrorBoundary>` hat. Beim Editieren der Videos, wo neben dem einen Video auch die Kategorien geladen werden, wäre es beispielsweise möglich das Cateogory FormField oder zumindest das entsprechende Select in eine eigene Komponente auszulagern und diese mit einem eigenen Suspense und ErrorBoundary zu versehen (dann würden die Daten des Videos bereits angezeigt werden während noch die Kategorien geladen werden).

### Inifinte Queries

Diese funktionieren ähnlich wie die normalen Queries - mit ein paar Erweiterungen/Änderungen:

1. Die Methode für das Prefetchen in der Server Komponente heißt `prefetchInfinite()`. Dieser muss man zumindest ein Objekt mit einem Attribut `limit` übergeben. Das bestimmt, wieviele Datensätze auf einmal geladen werden sollen.
2. Der Hook in der Client Komponente ist dann `useSuspenseInfiniteQuery`. Man darf Infinite und normale Queries auch nicht mischen, d. h. die beiden Dinge (prefetch und Client Hook) müssen zusammenpassen. `useSuspenseInfiniteQuery` erwartet zwei Parameter
   1. Zuerst ein Input-Objekt. Im einfachsten Fall hat dieses ein Attribut `limit` (das die Anzahl der Datensätze, die auf einmal geladen werden sollen, angibt). Dieses muss mit dem limit, dass man an `prefetchInfinite()` übergeben hat, übereinstimmen. Am besten macht man sich eine entsprechende Konstante und verwendet diese dann an beiden Stellen.
   2. Ein "Paging" Objekt. Im einfachsten Fall hat das ein Attribut getNextPageParam, das eine Funktion zur Ermittlung des Cursors für die nächste Seite liefert.
3. In der procedure muss man eine entsprechende input-Methode aufrufen, der man ein zod Objekt übergibt.
   1. Dieses zod Objekt muss zumindest ein Attribut cursor haben, das selbst wieder ein zod Objekt ist.
4. Die procedure ist entsprechend anzupassen. Am einfachsten kann man es für ein konkretes Beispiel verstehen. Daher hier der Code für das Laden der Videos des angemeldeten Benutzers:

```
import { z } from 'zod';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { eq, and, or, lt, desc } from 'drizzle-orm';

export const studioRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({ id: z.string().uuid(), updatedAt: z.date() })
          .nullish(),
        limit: z.number().min(1).max(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const { id: userId } = ctx.user;

      const data = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.userId, userId),
            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data

      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { items, nextCursor };
    }),
});
```

Zuerst wird im input der Cursor definiert. Er besteht aus einer id (string) und einem updatedAt (Zeitstempel). Die query Methode hat Zugriff auf den Kontext und den Input (wo der Cursor ja ein Teil davon ist). Dort werden die Videos des aktuellen Users geholt und außerdem wird auf die älteren Videos (relativ zum Cursor) eingeschränkt, wenn ein Cursor vorhanden ist. Die Videos werden absteigend nach createdAt und id sortiert (zusammen mit der Query für den Cursor sorgt das dafür, dass immer die nächsten Videos in der Liste geladen werden) - es ist also wichtig, dass die Sortierung und die Query mit dem Cursor "zusammenstimmt". Und dann werden die limit+1 Datensätze zurückgegeben.

Mit dem +1 Trick, kann man dann leicht feststellen, ob man am Ende der Videos ist (oder ob noch weitere folgen). Wenn dem so ist, wird als entsprechender nextCursor genau die Informationen, die diesen Datensatz identifizieren übergeben.

### Datenmanipulationen mit tRPC

Um Daten zu verändern wird genauso eine Route verwendet, allerdings benutzt diese nicht die Methode `.query()`, sondern `.mutation()`. Wichtig ist außerdem, dass man am Ende der Datenbank"query" (weil auch dort verwendet man dann .insert oder .update oder .delete) die Methode `.returning()` aufruft (damit man die manipulierten Daten dann in der Procedure zur Verfügung hat und diese an den Aufrufer zurückübermitteln kann) - siehe `/src/modules/videos/server/procedure.ts`.

In der Client Komponente kann dann die entsprechende Prozedur aufgerufen werden:

```
'use client';
import { Button } from '@/components/ui/button';
import { trpc } from '@/trpc/client';
import { PlusIcon } from 'lucide-react';

export const StudioUploadModal = () => {
  const utils = trpc.useUtils();
  const create = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
        // damit macht man das Ergebnis von studio.getMany() "ungültig" - und die betreffende Client Komponente kümmert sich darum die neuen Daten zu laden
    }
  });
  return (
    <Button variant='secondary' onClick={() => create.mutate()}>
      <PlusIcon />
      Create
    </Button>
  );
};
```

Beim Klick auf den Button wird ein neues Video in der Datenbank angelegt (indem der useMutation Hook der create Prozedur aufgerufen wird). Im Erfolgsfall (das Video wurde gespeichert) wird die Query für studio.getMany - das alle eigenen Videos lädt - invalidiert. Dazu wird der `useUtils` Hook von `trpc` verwendet, der ein Objekt mit diversen Hilfroutinen zur Verfügung stellt (eben z.b. `invalidate()` um eine bestimmte Query als "ungültig" zu markieren).

### tRPC - Inference der Typen von procedures

tRPC kommt mit einer netten Hilfsfunktion zum inferen der Typen von prodedures (ìnferRouterOutputs`).

```
import { inferRouterOutputs } from '@trcp/server';
import { AppRouter } from '@/trpc/routers/_app'; // dort hat man diese Zeile: export type AppRouter = typeof appRouter;
export type VideoGetOneOut = inferRouterOutputs<AppRouter>['videos']['getOne']; // das liefert eben den Typ des Outputs der Procedure getOne in der videos Route
```

## Infinite Scroll

Die prinzipielle Idee von Infinite Scroll ist es, dass immer ein (kleiner) Teil der nächsten Daten geladen wird, sobald der User weit genug nach unten scrollt. Der hier gezeigte Ansatz funktioniert mit folgender Idee:

In der Komponente, die die Daten darstellt ("Scrollcontainer") wird nach dem Element, dass die Daten darstellt (z. b. ein div) die InfiniteScroll Komponente eingefügt. Diese hat ein Detektor-Element. Wenn dieses sichtbar wird, wird das nächste Laden angestoßen. Dazu verwendet man einen custom Hook, der u. a. ein ref zurückgibt. Dieses ref wird dem Detektor-Element als ref übergeben. Außerdem definiert man in der InfiniteScroll Komponente einen useEffect, der gegebenenfalls die nächsten Daten lädt.

Es ist vorteilhaft, wenn man in der InfiniteScroll Komponente auch die Möglichkeit anbietet, dass der User selbst neue Daten laden kann, falls das Infinite Scroll nicht funktioniert (andernfalls hätte der User in dem Fall keine Möglichkeit weitere Daten zu laden).

Im Scrollcontainer bindet man die InfiniteScroll Komponente nach den Daten ein.

### Infinite Scroll - custom Hook

```
import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }
    return () => observer.disconnect();
  }, [options]);

  return { targetRef, isIntersecting };
};
```

### Infinite Scroll - Komponente

```
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useEffect } from 'react';
import { Button } from './ui/button';

interface InfiniteScrollProps {
  isManual?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export const InfiniteScroll = ({
  isManual = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollProps) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '100px',
  });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, isManual,fetchNextPage]);
  return (
    <div className='flex flex-col items-center gap-4 p-4'>
      <div ref={targetRef} className='h-1' />
      {hasNextPage ? (
        <Button
          variant='secondary'
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? 'Loading ...' : 'Load more'}
        </Button>
      ) : (
        <p className='text-xs text-muted-foreground'>
          You have reached the end of the list
        </p>
      )}
    </div>
  );
};
```

### Infinite Scroll - Scrollcontainer (am Beispiel der videos-section)

```
'use client';

import { InfiniteScroll } from '@/components/infinite-scroll';
import { DEFAULT_LIMIT } from '@/constants';
import { trpc } from '@/trpc/client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export const VideosSection = () => {
  return (
    <Suspense fallback={<p>Loading ...</p>}>
      <ErrorBoundary fallback={<p>Error ...</p>}>
        <VideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};
const VideosSectionSuspense = () => {
  const [data, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  return (
    <div>
      {JSON.stringify(data)}
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
```

## Javascript .flat() und .flatMap()

Dabei handelt es sich um zwei Array Methoden.

### .flat()

Drückt ein verschachteltes Array "flach(er)". Die Methode hat einen optionalen Parameter. Dieser gibt an, wieviele Ebenen flachgedrückt werden sollen. Der Standardwert ist 1. Und ein "Sonderfall" ist Infinity, dabei wird das Array komplett flach gedrückt, egal wie verschachtelt es ist.

```
const arr=[0,1,2,[3,4,[5,6,[7,8]]]];
arr.flat(); // Array [0, 1, 2, 3, 4, Array[5, 6, Array[7, 8]]]
arr.flat(2); // Array [0, 1, 2, 3, 4, 5, 6, Array[7, 8]]
arr.flat(3); // Array [0, 1, 2, 3, 4, 5, 6, 7, 8]
arr.flat(4); // Array [0, 1, 2, 3, 4, 5, 6, 7, 8] // es ist also kein Problem, wenn das Array nicht tief genug geschachtelt ist
arr.flat(Infinity) // Array [0, 1, 2, 3, 4, 5, 6, 7, 8] // es wird komplett flachgedrückt, egal wie tief es verschachtelt ist
```

### .flatMap()

Eigentlich sollte es mapFlat heißen, das besser beschreibt was es tut. Es wendet das `.map` auf das Array an und das gemappte Array, wird dann einmal geflattet. Die Methode hat einen Parameter, das ist die Callback Funktion für `.map`. Diese Methode ist etwas effizienter wie der manuelle Aufruf der beiden Methoden hintereinander.

```
const arr1 = [1, 2, 1];
arr1.flatMap((num) => (num === 2 ? [2, 2] : 1)); // Array [1, 2, 2, 1]
```

## [MUX](https://mux.com)

Mux ist ein Videoprocessing-Service. Es bietet einen kostenlosen Demozugang. In diesem gibt es allerdings folgende Beschränkungen:

- Videos dürfen maximal 30 Sekunden lang sein
- Videos werden automatisch nach 24 Stunden wieder gelöscht

Man meldet sich an, erstellt ein Environment (newtoobe-dev) und erstellt sich dann die Keys für dieses Environment. Diese legt man dann in `.env.local` ab:

```
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
```

Dann installiert man die Video Upload Komponente von MUX und die Node-Integration (die für das Empfangen des Webhooks, den MUX sendet, benötigt wird) in seinem Projekt: `bun add @mux/mux-uploader-react@1.1.1 @mux/mux-node@9.0.1`.

### Beispielvideo

Der Vortragende stellt unter https://tinyurl.com/newtube-clip ein kurzes englischsprachiges Video zur Verfügung. Mir ist es in kurzer Zeit nicht gelungen, ein, zwei weitere ähnliche Videos aufzutreiben.

### Mux Webhooks

Außerdem muss man auf der Mux Seite entsprechende Webhooks einrichten, damit Mux unsere Applikation benachrichtigen kann, wenn gewisse Ereignisse eintreten (z. b. Der Upload eines Videos ist fertig verarbeitet).

Auf der Mux Webseite geht man auf Settings, überprüft, dass man sich im richtigen Environment befindet und klickt dann auf **Create new webhook**.

Als URL trägt man hier die offizielle ngrok URL ein (ergänzt um `https://` am Anfang und `/api/videos/webhook` am Ende). Dann holt man sich das Signing Secret und speichert es in `.env.local` als `MUX_WEBHOOK_SECRET`.

### Video Upload

Für den eigentlichen Video Upload stellt Mux eine eigene Komponente zur Verfügung. Die wird in `studio-uploader.tsx` verwendet. Dabei wird die eigentliche Komponente ausgeblendet - aber wichtig sie muss vorhanden bleiben, weil diese die Logik steuert. Und das eigentliche GUI wird über die MuxUploaderDrop-Komponente realisiert. Bei dieser - und auch allen Subkomponenten wird die Verbindung zur eigentlichen Uploader-Komponente über das Prop muxUploader hergestellt.

Die Upload Komponente selbst wird im `studio-upload-modal.tsx` aufgerufen (entweder als Dialog oder als Drawer für Mobilgeräte). Außerdem legt die Komponente auch einen neuen Datensatz für ein Video an. Das hat zwar den "Schönheitsfehler", dass wenn der User dann den Upload nicht macht entsteht ein verwaistes Element in der Datenbank. In weiterer Folge werden wir uns um dieses Problem noch kümmern.

Dann müssen wir noch einen Endpunkt für den Webhook erstellen, den MUX aufruft, wenn gewisse Ereignisse stattfinden. Dies passiert in `app/api/videos/webhook/route.ts`.

Im Header des Requests von MUX wird die mux-signature mitgeschickt. Dann wird der Webhook verifiziert (mit Hilfe einer Funktion von MUX) und dann wird je nach Art des Events die entsprechende Aktion vorgenommen. Zum derzeitigen Zeitpunkt reagiert der Webhook nur auf "video created" events und aktualisiert in dem Fall die muxAssetId und den muxStatus in der Datenbank.

## React Hook Form und tRPC

Mit tRPC (womit man die create oder update Mutations bekommt) und React Hook Form hat man zwei verschiedene Ansätze zur Wahl, wie man mit onSubmit umgeht. Entweder man definiert den eigenen onSubmit Handler als async und awaitet update.mutateAsync(...) oder man definiert es nicht als async und verwendet update.mutate(...). Im async/await Fall kann man über `form.formState.isSubmitting` feststellen, ob gerade ein onSubmit läuft. Im nicht async Fall kann man update.isPending auswerten - um das gleiche festzustellen, d. h. es gibt hier kein "richtig" oder "falsch" - man muss nur die Überprüfung, ob gerade eine "Transaktion" läuft an die gewählte Lösung im onSubmit anpassen.

## Uploadthing

Uploadthing ist ein Filesharingservice. Es bietet mit seinen Integrationen `uploadthing` und `@uploadthing/react` auch eine Server API an (die man in Server Actions verwenden kann - womit man direkt am Server Files nach Uploadthing hochladen oder auch von dort herunterladen kann).

```
import { UTApi } from 'uploadthing/server';
...
      const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;

      const utapi = new UTApi();
      const [uploadedThumbnail, uploadedPreview] =
        await utapi.uploadFilesFromUrl([tempThumbnailUrl, tempPreviewUrl]);

      if (!uploadedThumbnail.data || !uploadedPreview.data) {
        return new Response('Failed to upload thumbnail or preview', {
          status: 500,
        });
      }
```

In dem Beispiel laden wir zwei Dateien (von MUX - aber das ist eigentlich egal) zu uploadThing hoch. Am Ende prüfen wir dann noch, ob beide Dateien erfolgreich hochgeladen wurden - falls nicht brechen wir mit einem 500er Status ab (Servererror).

## Backgroundjobs

Wofür kann man Backgroundjobs verwenden:

- Für langlaufende Tasks: weil es problematisch sein kann, wenn man seine App bei einem "Hoster" deployen und diese langlaufender Tasks enthalten, weil der Hoster diesen Task/Request wahrscheinlich mit einem Timeout beendet
- Um Retries zu implementieren

### [Upstash Workflows](https://upstash.com/docs/workflow/getstarted)

Workflows werden mittels der `serve` Funktion von Upstash ausgelöst. In dieser definiert man einzelne Schritte als Funktionen. Diese Funktionen laufen aber nicht im eigenen Backend sondern in einer speziellen Umgebung bei Upstash (dort gibt es "keine" Timeouts - womit sie sich für langlaufende Tasks eigenen).

Die Workflows werden über einen eigenen qStash-Client angetriggert. Diesen erstellt man sich am einfachsten in einer kurzen lib-Datei (/lib/workflow.ts), reichert ihn an der Stelle mit dem QSTASH_TOKEN an, exportiert diesen und bindet den Client dann überall dort ein, wo man einen Workflow auslösen will:

**/lib/workflow.ts**

```
import { Client } from '@upstash/workflow';
export const workflow = new Client({ token: process.env.QSTASH_TOKEN! });
```

Da die Funktion serve einen (API) Route handler zur Verfügung stellt ist es üblich diese Funktion in einer eigenen API-route zu verwenden. D. h. innerhalb der eigenen Applikation ruft man seine API-Route auf, die das Ergebnis von `serve` ist. Und serve erwartet als ersten Parameter die Callbackfunktion, die beim Aufruf der API Route ausgeführt werden soll.

Im folgenden Beispiel sieht man einen Workflow, der aus zwei Schritten besteht (jedes `context.run` ist ein eigener Workflowschritt). Im Normalfall ist das dann eine async Routine (weil sie ja von der "Idee" her länger läuft, sonst würde man nicht den Umweg über den Workflow gehen).

```
import { serve } from '@upstash/workflow/nextjs';

interface InputType {
  userId: string;
  videoId: string;
}

export const { POST } = serve(async (context) => {
  const { videoId, userId } = context.requestPayload as InputType;
  const existingVideo = await context.run('get-video', async () => {
    const data = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    return data;
  });
  if (!existingVideo) throw new Error('Not found');

  await context.run('step-2', () => {
    console.log(`step-2: videoId:${input.videoId}`);
  });
});

```

#### serve

Die Callbackfunktion erhält als ersten Parameter den context. Dieser ist nützlich weil er einerseits die Parameter erhält, die man an die eigene API übergeben hat (im Attribut input) und andererseits erhält er auch das environment (im Attribut env), d. h. in der Funktion kann man dann mit `env.MEINE_ENV_VARIABLE` auf den Wert, der in der Environment-Variable MEINE_ENV_VARIABLE gespeichert ist zugreifen.

#### context.run

Die context.run Funktion erwartet zwei Parameter: eine Bezeichnung des Workflowschritts (den sieht man dann auf der Weboberfläche von Upstash) und eben die Funktion, die diesen Schritt ausmacht. Im obigen Beispiel wird im ersten Schritt das entsprechende Video aus der Datenbank geladen. Danach wird ein Fehler geworfen, wenn das Video nicht gefunden wird (oder es nicht dem User gehört). Wenn man diesen Fehler innerhalb von context.run wirft, interpretiert das Upstash als temporäres Problem und wird diesen Schritt so oft wiederholen, bis er entweder erfolgreich ist oder bis das Retry Limit erreicht ist.

Daher ist es wichtig, beim Werfen eines Fehlers zu überlegen, ob es ein temporäer Fehler ist (z. b. der Endpunkt wurde nicht erreicht) oder ein permanenter Fehler (in unserem Fall ruft irgendwas die API falsch auf) - und je nachdem an der richtigen Stelle den Fehler zu werfen (bei uns eben außerhalb von `context.run`, weil wir nicht davon ausgehen, dass bei einer erneuten Datenbankabfrage auf einmal das gesuchte Video auftaucht).

Wenn man etwas in `context.run` returned wird das auch als Ergebnis des jeweiligen Schritts in der Upstash Workflow Eventansicht angezeigt. Es ist also durchaus überlegenswert etwas zu returnen, auch wenn man das Ergebnis nicht unbedingt für die weitere Verarbeitung in der App benötigt (weil es das Troubleshooting erleichtert).

Im Moment habe ich nur das Problem, dass ich keine Möglichkeit gefunden habe, wie man einen Endpunkt anstößt, der die Parameter als formData erwartet, weil context.run den Content-Type Header scheinbar immer auf 'application/json' setzt).

#### Zusammenspiel mit tRPC

Wenn man auch tRPC verwendet, kommt noch eine Ebene "dazwischen" - die procedures, die im createTRPCRouter definiert werden. Hier ein Beispiel, wie so eine Procedure aussehen kann:

```
import { workflow } from '@/lib/workflow';
...
  generateThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid() })) // die Prozedur erwartet einen Parameter id vom Type z.string().uuid()
    .mutation(async ({ ctx, input }) => { // es ist eine "ändernde" Prozedur, die sowohl den Kontext als auch die übergebenen Parameter verarbeiten soll
      const { id: userId } = ctx.user; // aus dem Kontext holt man die userId (bzw. aus ctx.user die id und nennt sie auf userId um)
      const url = `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`; // die UPSTASH_WORKFLOW_URL ist die offizielle Domäne, die man über ngrok bekommt
      console.log('generateThumbnail,url', url);
      const { workflowRunId } = await workflow.trigger({ // Hier wird der Workflow aufgerufen - indem eben die Url angestoßen wird, d. h. über diese steuert man genau welchen Workflow man triggern will
        url,
        body: { userId, videoId: input.id }, // Im body übergibt man die Parameter für den Workflow - die in der Workflowfunktion dann über context.requestPayload zur Verfügung stehen
        retries: 1,
      });
      return workflowRunId;
    }),
```

## AI - OpenAI Alternative (Google Gemini)

I will try Google Gemini as they offer a free tier, which I guess is sufficient and the API doesn't look very complicated (https://ai.google.dev/gemini-api/docs/quickstart?lang=node).

```
bun add @google/generative-ai
```

### Get your API-Key

First things first, so let's get an API key - https://aistudio.google.com/app/apikey, and there you have "Get API key". Store your API key in a secret place and I think it is also a good idea to store the google project number in the same place.

### Create a lib file to centralize all Gemini stuff in one place

I've decided to create a `/lib/gemini.ts`, where I bundle all things related to Gemini. With this approach I can define the model to use only once. Maybe I will even go one step further and put the model in an environment variable so I can change it without building the whole application again. But for now it is good enough.

```
export { GoogleGenerativeAI } from '@google/generative-ai';
export const GEMINI_PREFERED_MODEL = 'gemini-2.0-flash-lite-preview-02-05';
export const GEMINI_BACKUP_MODEL = 'gemini-1.5-flash';
```

### Generate the title from the transcript

The generation assumes, that the transcript is already available in the variable transcript. It got fetched before from MUX. The rest of the prompt is the one Antonio shares at his [public Gist](https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbEo2MGtDaDYzY1kyc0lTUDA2V0xJX1hQajBkQXxBQ3Jtc0tuellRSmNXYk0tWV9lSklfSGp1YzRHQUpnX25BZEJmYld0MHc4WkZwRWFhSEVmbEZ4bW5hRmVuOE1DcktQQklCNUhlUXU4Rm1USTN5QU9XNW1EcEVYeXVBQmhpUTJ0dWUyckVPcV9fOGo0emVRMEZYSQ&q=https%3A%2F%2Fdub.sh%2Fyoutube-clone-assets&v=ArmPzvHTcfQ).

```
  const generatedTitle = await context.run('generate-title', async () => {
    const genAI = new GoogleGenerativeAI(context.env.GEMINI_APIKEY!);
    const model = genAI.getGenerativeModel({ model: GEMINI_PREFERED_MODEL });

    const prompt = `${TITLE_PROMPT}"${transcript}"`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
```

## AI - OpenAI Alternative ([Imagine.Art](https://www.imagine.art/))

Unfortunatly Google Gemini offers no free tier for text to image creation. I've searched the internet and finally I found an AI API that offers free text to image conversion, **Imagine art**. But there is another downside to this service - it expects the input as formData - and until now I'm not able to get Upstash Workflow to send the data as form Data (no matter what type of header I put in the request, it is always converted to `application/json`). That's why the generate thumbnail option is temporary disabled (I will activate it later , if I find a solution to send formData or if I find another text to image AI with a free tier).
