import Foundation

/// Backend endpoints. Generation, credits and uploads go through sokozia.com (same API as the web
/// app, authenticated with the InsForge access token); sign-in talks to InsForge directly.
enum SokoziaConfig {
    static let siteURL = URL(string: "https://sokozia.vercel.app")!
    static let authURL = URL(string: "https://h8fj6hqu.eu-central.insforge.app")!
    /// Google sign-in returns here, then to the app through the `sokozia://` scheme.
    static let oauthReturnURL = "https://sokozia.vercel.app/api/auth/mobile-callback"
    static let callbackScheme = "sokozia"
    /// Credits granted by the server on the first sign-in.
    static let welcomeCredits = 50
}

/// African-market config, same values as the web app (lib/market.ts): countries, currencies,
/// Mobile Money, local languages, pay-as-you-go packs and the local promo calendar.
/// Every price is defined once in FCFA and converted per country.
enum Market {

    struct Currency {
        let code: String
        let symbol: String
        let perXof: Double
        let step: Int
    }

    static let currencies: [String: Currency] = [
        "XOF": Currency(code: "XOF", symbol: "FCFA", perXof: 1, step: 100),
        "XAF": Currency(code: "XAF", symbol: "FCFA", perXof: 1, step: 100),
        "NGN": Currency(code: "NGN", symbol: "₦", perXof: 2.7, step: 100),
        "KES": Currency(code: "KES", symbol: "KSh", perXof: 0.23, step: 10),
        "GHS": Currency(code: "GHS", symbol: "GH₵", perXof: 0.025, step: 1),
        "CDF": Currency(code: "CDF", symbol: "FC", perXof: 5, step: 500),
    ]

    struct PaymentMethod: Identifiable, Hashable {
        let id: String
        let label: String
        let colorHex: UInt
        let mobile: Bool
    }

    static let paymentMethods: [String: PaymentMethod] = [
        "wave": PaymentMethod(id: "wave", label: "Wave", colorHex: 0x1DC8F2, mobile: true),
        "orange-money": PaymentMethod(id: "orange-money", label: "Orange Money", colorHex: 0xFF7900, mobile: true),
        "mtn-momo": PaymentMethod(id: "mtn-momo", label: "MTN MoMo", colorHex: 0xFFCC00, mobile: true),
        "moov-money": PaymentMethod(id: "moov-money", label: "Moov Money", colorHex: 0x0067B1, mobile: true),
        "mpesa": PaymentMethod(id: "mpesa", label: "M-Pesa", colorHex: 0x4CAF50, mobile: true),
        "airtel-money": PaymentMethod(id: "airtel-money", label: "Airtel Money", colorHex: 0xE40000, mobile: true),
        "card": PaymentMethod(id: "card", label: "Carte bancaire", colorHex: 0x71717A, mobile: false),
    ]

    struct Language: Identifiable, Hashable {
        let id: String
        let label: String
    }

    static let languages: [Language] = [
        Language(id: "fr", label: "Français"),
        Language(id: "en", label: "Anglais"),
        Language(id: "wo", label: "Wolof"),
        Language(id: "dyu", label: "Dioula"),
        Language(id: "bm", label: "Bambara"),
        Language(id: "ln", label: "Lingala"),
        Language(id: "sw", label: "Swahili"),
        Language(id: "pcm", label: "Pidgin"),
    ]

    static func languageLabel(_ id: String) -> String { languages.first { $0.id == id }?.label ?? id }

    struct Country: Identifiable, Hashable {
        let code: String
        let name: String
        let flag: String
        let currency: String
        let dialCode: String
        let payments: [String]
        let languages: [String]
        var id: String { code }
    }

    static let countries: [Country] = [
        Country(code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", dialCode: "221", payments: ["wave", "orange-money", "card"], languages: ["fr", "wo"]),
        Country(code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", dialCode: "225", payments: ["wave", "orange-money", "mtn-momo", "moov-money", "card"], languages: ["fr", "dyu"]),
        Country(code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", dialCode: "223", payments: ["orange-money", "wave", "moov-money", "card"], languages: ["fr", "bm"]),
        Country(code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", dialCode: "226", payments: ["orange-money", "moov-money", "wave", "card"], languages: ["fr", "dyu"]),
        Country(code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", dialCode: "237", payments: ["mtn-momo", "orange-money", "card"], languages: ["fr", "en", "pcm"]),
        Country(code: "CD", name: "RD Congo", flag: "🇨🇩", currency: "CDF", dialCode: "243", payments: ["mpesa", "orange-money", "airtel-money", "card"], languages: ["fr", "ln", "sw"]),
        Country(code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", dialCode: "234", payments: ["mtn-momo", "airtel-money", "card"], languages: ["en", "pcm"]),
        Country(code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS", dialCode: "233", payments: ["mtn-momo", "airtel-money", "card"], languages: ["en", "pcm"]),
        Country(code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", dialCode: "254", payments: ["mpesa", "airtel-money", "card"], languages: ["en", "sw"]),
    ]

    /// Pilot country, used until the user picks another one.
    static let defaultCountry = "CI"

    static func country(_ code: String?) -> Country {
        countries.first { $0.code == code } ?? countries.first { $0.code == defaultCountry }!
    }

    /// FCFA amount converted to the country's currency, rounded to a clean step.
    static func convert(_ amountXof: Int, to currency: String) -> Int {
        guard let c = currencies[currency] else { return amountXof }
        let raw = Double(amountXof) * c.perXof
        return max(c.step, Int((raw / Double(c.step)).rounded()) * c.step)
    }

    /// "1 000 FCFA", "₦2 700", "KSh 230".
    static func format(_ amount: Int, currency: String) -> String {
        let symbol = currencies[currency]?.symbol ?? currency
        let n = amount.formatted(.number.locale(Locale(identifier: "fr_FR")))
        return symbol == "FCFA" || symbol == "FC" ? "\(n) \(symbol)" : "\(symbol)\(n)"
    }

    /// An FCFA base price shown in a country's currency.
    static func price(_ amountXof: Int, country code: String?) -> String {
        let c = country(code)
        return format(convert(amountXof, to: c.currency), currency: c.currency)
    }

    // MARK: Pay-as-you-go packs

    struct UsagePack: Identifiable, Hashable {
        let id: String
        let name: String
        let pitch: String
        let priceXof: Int
        let credits: Int
        var validityDays: Int? = nil
        var popular = false
    }

    /// Sold without subscription: many merchants manage cash day to day.
    static let usagePacks: [UsagePack] = [
        UsagePack(id: "pack_decouverte", name: "Pack Découverte", pitch: "5 photos IA", priceXof: 1_000, credits: 50),
        UsagePack(id: "pack_boutique", name: "Pack Boutique", pitch: "4 visuels produit + 1 vidéo", priceXof: 3_500, credits: 200, popular: true),
        UsagePack(id: "pass_semaine", name: "Pass Semaine", pitch: "7 jours pour tout créer", priceXof: 5_000, credits: 400, validityDays: 7),
    ]

    /// Bigger one-off top-ups for regular users (credits never expire).
    static let topUpPacks: [UsagePack] = [
        UsagePack(id: "topup_1500", name: "Recharge 1 500", pitch: "+10 % offerts", priceXof: 19_900, credits: 1_650),
        UsagePack(id: "topup_5000", name: "Recharge 5 000", pitch: "+20 % offerts", priceXof: 54_900, credits: 6_000),
    ]

    /// Shown until Mobile Money payments are connected (same message as the web app).
    static let paymentsComingSoon = "Paiement Mobile Money bientôt disponible. Écrivez-nous sur WhatsApp pour recharger."

    // MARK: WhatsApp

    /// Sokozia's own WhatsApp line (ambassadors, support). Replace with the real number before launch.
    static let sokoziaWhatsApp = "+225 00 00 00 00 00"

    /// wa.me link with a pre-filled message.
    static func whatsappLink(_ phone: String, message: String) -> URL? {
        let digits = phone.filter(\.isNumber)
        var c = URLComponents(string: "https://wa.me/\(digits)")
        c?.queryItems = [URLQueryItem(name: "text", value: message)]
        return c?.url
    }

    // MARK: Local promo calendar

    struct PromoMoment: Identifiable, Hashable {
        let id: String
        let name: String
        /// yyyy-mm-dd. Religious dates are estimates and shift by a day or two with the moon.
        let date: String
        let pitch: String
        let sectors: [String]
        let templateIds: [String]

        var day: Date? {
            let f = DateFormatter()
            f.dateFormat = "yyyy-MM-dd"
            f.timeZone = TimeZone(identifier: "UTC")
            return f.date(from: date)
        }
    }

    static let promoMoments: [PromoMoment] = [
        PromoMoment(id: "noel-2026", name: "Noël & fêtes de fin d'année", date: "2026-12-25", pitch: "Idées cadeaux, tenues de fête, menus de réveillon.", sectors: ["Couture & wax", "Cosmétiques", "Alimentation"], templateIds: ["tpl_10", "tpl_7"]),
        PromoMoment(id: "ramadan-2027", name: "Début du Ramadan", date: "2027-02-08", pitch: "Dattes, repas de rupture, tenues et parfums.", sectors: ["Alimentation", "Restauration"], templateIds: ["tpl_11", "tpl_6"]),
        PromoMoment(id: "korite-2027", name: "Korité (Aïd el-Fitr)", date: "2027-03-10", pitch: "Tenues, coiffures, bijoux : la semaine qui fait le chiffre.", sectors: ["Couture & wax", "Coiffure"], templateIds: ["tpl_24", "tpl_12"]),
        PromoMoment(id: "fete-meres-2027", name: "Fête des mères", date: "2027-05-30", pitch: "Coffrets beauté, bijoux, pagnes et bons cadeaux.", sectors: ["Cosmétiques", "Couture & wax"], templateIds: ["tpl_7", "tpl_5"]),
        PromoMoment(id: "tabaski-2027", name: "Tabaski (Aïd el-Kébir)", date: "2027-05-17", pitch: "Boubous, bazin, moutons, électroménager : anticipez de 3 semaines.", sectors: ["Couture & wax", "Alimentation", "Électronique"], templateIds: ["tpl_1", "tpl_9"]),
        PromoMoment(id: "rentree-2027", name: "Rentrée scolaire", date: "2027-09-20", pitch: "Fournitures, uniformes, téléphones et tablettes.", sectors: ["Électronique", "Couture & wax"], templateIds: ["tpl_8", "tpl_3"]),
    ]

    /// Upcoming moments first, with the number of days left.
    static func upcomingMoments(from now: Date = Date()) -> [(moment: PromoMoment, daysLeft: Int)] {
        promoMoments.compactMap { m -> (PromoMoment, Int)? in
            guard let d = m.day else { return nil }
            let days = Int((d.timeIntervalSince(now) / 86_400).rounded(.up))
            return days >= 0 ? (m, days) : nil
        }
        .sorted { $0.1 < $1.1 }
    }
}
