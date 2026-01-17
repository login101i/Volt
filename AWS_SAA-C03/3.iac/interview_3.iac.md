🟢 Synteza lekcji: co powinieneś wiedzieć
1️⃣ Bucket S3 vs CloudFormation Stack

Bucket S3: fizyczny zasób w AWS do przechowywania danych (pliki, CSV, Parquet).

CloudFormation Stack: definicja zasobów w AWS (np. S3, Lambda, Redshift) w formie szablonu YAML/JSON.

Relacja: Stack może tworzyć i zarządzać bucketami, ale bucket może istnieć samodzielnie.

2️⃣ Deploy stacka w praktyce

aws cloudformation deploy --template-file template.yaml --stack-name cfn-s3-simple tworzy stack i zasoby.

--no-execute-changeset → tylko tworzy plan zmian, nie tworzy bucketu.

Jeśli zobaczysz komunikat o Changeset created successfully, musisz wykonać changeset:

aws cloudformation execute-change-set --change-set-name <ARN_changesetu>


Ścieżka do template.yaml musi być poprawna – inaczej CLI zwróci Invalid template path.

3️⃣ Uprawnienia IAM

Twój użytkownik musi mieć odpowiednie polityki:

cloudformation:CreateStack

cloudformation:DescribeStacks

cloudformation:UpdateStack

s3:CreateBucket

Brak uprawnień → błędy AccessDenied.

4️⃣ Najczęstsze błędy i jak je rozwiązać
Problem	Przyczyna	Rozwiązanie
Invalid template path	Plik YAML nie w katalogu lub źle podana ścieżka	Podaj pełną/względną ścieżkę do template.yaml
AccessDenied	Brak uprawnień IAM	Dodaj odpowiednie polityki do użytkownika/rolę
Bucket nie pojawia się w S3	Użyto --no-execute-changeset	Usuń parametr lub wykonaj changeset
5️⃣ Dlaczego warto to znać w pracy Data Engineer

Pipeline’y ETL/ELT zapisują dane w S3 (staging/raw/processed).

CloudFormation umożliwia automatyzację i powtarzalność tworzenia środowisk (reproducibility).

Rozumienie zależności stack ↔ changeset ↔ zasób pozwala lepiej zarządzać infrastrukturą danych.

🔹 Czy cfn-s3-simple jest potrzebny w Twojej pracy?

Niekoniecznie ten konkretny stack, ale:

Znajomość S3 jest wymagana (przechowywanie danych, staging, raw/processed).

Umiejętność pracy z CloudFormation lub innym IaC jest bardzo przydatna (automatyzacja infrastruktury, reproducible environments).

Czyli stack jest przykładem nauki, nie musisz go używać w produkcji, ale warto wiedzieć jak działa i jak go deployować.

❓ 3 przykładowe pytania rekrutacyjne powiązane z tematem

S3 vs CloudFormation

S3 vs CloudFormation

Pytanie: „Opowiedz, czym różni się bucket S3 od stacka CloudFormation i w jakich scenariuszach użyłbyś każdego z nich w pipeline’ach danych?”

Odpowiedź:

Bucket S3 to fizyczny zasób w AWS, czyli miejsce do przechowywania plików i danych (CSV, Parquet, logi). W pipeline’ach ETL/ELT służy np. do trzymania surowych danych (raw), danych przetworzonych (processed) lub wyników analitycznych.

Stack CloudFormation to definicja zasobów w formie szablonu YAML/JSON. Stack może automatycznie tworzyć i konfigurować bucket S3, role IAM, Redshift itp. Jest przydatny do automatyzacji infrastruktury, tworzenia reproducible environments i łatwego zarządzania zmianami w środowisku danych.

Podsumowując: bucket = dane, stack = sposób tworzenia i zarządzania infrastrukturą.

2️⃣ Uprawnienia IAM i troubleshoot

Pytanie: „Twój deploy stacka CloudFormation zwraca błąd AccessDenied. Jak krok po kroku zdiagnozujesz problem i jakie polityki IAM będą potrzebne do utworzenia S3 bucketu?”

Odpowiedź:

Sprawdzam dokładny komunikat błędu w CLI, np. AccessDenied: cloudformation:DescribeStacks.

Identyfikuję, który użytkownik lub rola IAM wykonuje komendę.

Sprawdzam polityki przypisane do tego użytkownika/roli w AWS IAM.

Dodaję potrzebne uprawnienia do polityki, np.:

cloudformation:CreateStack, cloudformation:DescribeStacks, cloudformation:UpdateStack

s3:CreateBucket, s3:PutBucketPolicy, s3:ListBucket

Po aktualizacji polityki ponownie uruchamiam deploy stacka.

Weryfikuję, czy bucket pojawił się w S3 i czy stack ma status CREATE_COMPLETE.

3️⃣ Changeset i faktyczne utworzenie zasobów

Pytanie: „Co się stanie, jeśli użyjesz --no-execute-changeset przy deployu stacka w CloudFormation? Jak wykonać resources w praktyce?”

Odpowiedź:

Użycie --no-execute-changeset tylko tworzy plan zmian (changeset), ale nie tworzy ani nie aktualizuje zasobów w AWS.

CLI wyświetli ARN changesetu i instrukcję do jego podglądu.

Aby faktycznie utworzyć bucket i inne zasoby, należy wykonać:

aws cloudformation execute-change-set --change-set-name <ARN_changesetu>


Po wykonaniu changesetu zasoby powstaną w AWS i będzie można je zobaczyć np. w S3.



 a temat AWS s3 terraform simple mam przejrzeć w kursie ? 

Tak, warto przejrzeć, ale z odpowiednim nastawieniem. 🙂

Dlaczego warto:

Pokazuje podstawy IaC (Infrastructure as Code)

Terraform i CloudFormation służą do automatycznego tworzenia zasobów w AWS (S3, Redshift, Lambda itp.).

Nawet prosty przykład aws-s3-simple pozwala zobaczyć workflow: kod → plan → deploy → zasób.

Zrozumiesz zależności i uprawnienia

Musisz wiedzieć, że żeby coś utworzyć, potrzebujesz odpowiednich polityk IAM.

W prostym przykładzie S3 Terraform → łatwo zobaczyć jak działa provisioning, a później to samo stosuje się do bardziej skomplikowanych środowisk.

Przygotowanie do rozmowy rekrutacyjnej

Nawet jeśli w pracy nie będziesz używał dokładnie “aws-s3-simple”, rekruter może zapytać:

“Jak automatyzujesz tworzenie zasobów w AWS?”

“Co to jest changeset w CloudFormation / plan w Terraform?”

Jak do tego podejść w kursie

Nie ucz się wszystkich parametrów Terraform od A do Z.

Skup się na:

Tworzeniu prostego bucketu S3.

Widzisz różnicę między planem (terraform plan) a wykonaniem (terraform apply).

Jak wygląda struktura plików / stacków (czyli main.tf, variables.tf, outputs.tf).

💡 Tip: traktuj to jako mini-lab do nauki IaC, który później pozwoli Ci sprawnie pracować z produkcyjnymi pipeline’ami i S3 w roli Data Engineer.



🌟 Terraform – Pigułka wiedzy dla Data Engineer
1️⃣ Co to jest Terraform?

Terraform = narzędzie Infrastructure as Code (IaC) do automatycznego tworzenia i zarządzania zasobami w chmurze (AWS, Azure, GCP…).

Zamiast ręcznie klikać w AWS Console, piszesz konfigurację w kodzie (.tf) i uruchamiasz ją.

Działa deklaratywnie: opisujesz co ma istnieć, Terraform sam oblicza jak to osiągnąć.

2️⃣ Podstawowy workflow

Napisz konfigurację (main.tf) – np. prosty bucket S3:

provider "aws" {
  region = "us-west-2"
}

resource "aws_s3_bucket" "example" {
  bucket = "my-data-bucket"
  acl    = "private"
}


Zainicjalizuj Terraform

terraform init


Sprawdź plan zmian

terraform plan


Wyświetli, co zostanie utworzone/zmienione/usunięte.

Zastosuj zmiany

terraform apply


Terraform utworzy bucket w AWS.

Sprawdź stan

terraform show
terraform state list


Pokazuje jakie zasoby istnieją i co Terraform zarządza.

3️⃣ Co warto zapamiętać

Deklaratywność: piszesz co ma istnieć, Terraform rozlicza różnice ze stanem rzeczywistym.

Plan → Apply: zawsze sprawdź plan przed wykonaniem zmian.

State: Terraform zapisuje stan w pliku terraform.tfstate, dzięki temu wie, co już istnieje.

Resource naming: unikalne nazwy w AWS (S3 bucket musi być globalnie unikalny).

Moduły: pozwalają tworzyć powtarzalne komponenty (np. standardowy bucket + polityka + wersjonowanie).

IAM / uprawnienia: użytkownik/rola musi mieć odpowiednie polityki do tworzenia zasobów.

4️⃣ Dlaczego przyda się w pracy Data Engineer

Tworzysz środowiska danych reproducible: S3 bucket, Redshift, Glue, Lambda, EC2.

Automatyzujesz pipeline’y ETL/ELT – deployment zasobów nie wymaga ręcznego klikania.

Łatwo version control infrastruktury – wszystko w Git.

Przy rozmowie rekrutacyjnej pokazuje, że potrafisz IaC i automatyzację infrastruktury.

5️⃣ Na czym się skupić przed rozmową

Jak utworzyć bucket S3 i sprawdzić, że istnieje (terraform plan/apply).

Co to jest state file i dlaczego jest ważny.

Różnica między CloudFormation a Terraform (CFN = AWS-only, Terraform = multi-cloud).

Jak działa workflow init → plan → apply → destroy.

Znajomość podstawowych resource’ów AWS potrzebnych w ETL: S3, IAM, Redshift, Lambda.

💡 Tip rekrutacyjny:
Nie musisz znać wszystkich zaawansowanych funkcji Terraform, ale jeśli pokażesz, że potrafisz stworzyć bucket, sprawdzić plan, zastosować zmiany i rozumiesz workflow – rekruter od razu wie, że ogarniasz IaC w praktyce.