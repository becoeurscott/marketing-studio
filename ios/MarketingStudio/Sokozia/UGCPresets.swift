import Foundation

/// A ready-made UGC video format: the user only picks a creator (avatar) and a product.
/// `direction` is the English scene brief sent to Seedance 2.5; `script` is the default French line.
struct UGCPreset: Identifiable, Hashable, Codable {
    let id: String
    let title: String
    let hint: String
    let icon: String
    let direction: String
    let script: String
    let duration: Int
}

enum UGCPresets {
    static let all: [UGCPreset] = [
        .init(id: "before-after", title: "Avant / Après", hint: "Montre le résultat du produit", icon: "arrow.left.arrow.right",
              direction: "Before-and-after UGC. First half: the person looks tired or frustrated with the problem, soft dull light. Quick jump cut. Second half: same person, glowing and happy after using the product, bright light, shows the product to the camera.",
              script: "Avant, j’avais ce problème… Depuis que j’utilise ce produit, regardez la différence !", duration: 10),
        .init(id: "unboxing", title: "Unboxing", hint: "Déballage enthousiaste", icon: "shippingbox",
              direction: "Unboxing UGC on a table, handheld selfie angle. The person opens the package with excitement, pulls out the product, turns it slowly toward the camera, close-up on details, then smiles.",
              script: "Mon colis vient d’arriver ! On ouvre ensemble… Regardez la qualité, je suis trop contente.", duration: 10),
        .init(id: "testimonial", title: "Témoignage", hint: "Avis client sincère", icon: "quote.bubble",
              direction: "Honest testimonial UGC. The person sits at home facing the camera, holding the product near the face, speaking sincerely with natural gestures, warm daylight, slight handheld movement.",
              script: "Je vous donne mon avis honnête : ce produit a vraiment changé mon quotidien. Je le recommande.", duration: 15),
        .init(id: "demo", title: "Démo produit", hint: "Explique comment l’utiliser", icon: "hand.point.up.left",
              direction: "Product demo UGC. The person shows step by step how to use the product, close-ups of hands using it, then back to the face explaining the result.",
              script: "Je vous montre comment l’utiliser : c’est très simple, en trois étapes. Et voilà le résultat !", duration: 15),
        .init(id: "routine", title: "Routine beauté", hint: "Soin, cosmétique, cheveux", icon: "sparkles",
              direction: "Morning beauty routine UGC in a bright bathroom mirror. The person applies the product on skin or hair, gentle close-ups of texture, then shows the glowing result to the camera.",
              script: "Ma routine du matin avec mon produit préféré. La texture est incroyable et ma peau est toute douce.", duration: 15),
        .init(id: "tasting", title: "Dégustation", hint: "Plat, boisson, épicerie", icon: "fork.knife",
              direction: "Food tasting UGC at a lively maquis or kitchen. The person presents the product, takes a bite or sip, reacts with genuine delight, nods and points at it.",
              script: "On goûte ensemble ? Hmm… C’est trop bon ! Vous devez absolument essayer.", duration: 10),
        .init(id: "fashion", title: "Essayage mode", hint: "Vêtements, pagne, accessoires", icon: "tshirt",
              direction: "Fashion try-on UGC in a boutique fitting area. The person shows the item, quick outfit reveal, turns around to show the fit, poses confidently in front of a mirror.",
              script: "Regardez cette tenue ! La coupe est parfaite et le tissu est de très bonne qualité.", duration: 10),
        .init(id: "wow", title: "Réaction « wow »", hint: "Accroche forte en 3 s", icon: "exclamationmark.bubble",
              direction: "Hook-style UGC. The person stops scrolling, looks surprised, leans toward the camera, then reveals the product with an amazed expression and fast energetic delivery.",
              script: "Attendez ! Vous ne connaissez pas encore ça ? C’est exactement ce qu’il vous faut.", duration: 10),
        .init(id: "street", title: "Interview de rue", hint: "Ambiance micro-trottoir", icon: "mic",
              direction: "Street interview UGC in a busy African market street. The person holds a small microphone, talks to the camera, shows the product, passers-by softly blurred behind.",
              script: "On est au marché et je vous présente le produit dont tout le monde parle en ce moment.", duration: 10),
        .init(id: "promo", title: "Offre promo", hint: "Annonce une réduction", icon: "tag",
              direction: "Promotional UGC. The person holds the product, points at it enthusiastically, counts on fingers, announces a limited offer with urgency, ends with a call to action gesture.",
              script: "Promo spéciale cette semaine seulement ! Commandez vite sur WhatsApp avant la fin du stock.", duration: 10),
        .init(id: "comparison", title: "Comparatif", hint: "Ce produit vs les autres", icon: "scalemass",
              direction: "Comparison UGC. The person holds an ordinary unbranded alternative in one hand and the product in the other, compares them, then puts the alternative away and keeps the product, convinced.",
              script: "J’ai comparé avec ce que j’utilisais avant : franchement, il n’y a pas photo.", duration: 15),
        .init(id: "gift", title: "Idée cadeau", hint: "Fêtes, anniversaires", icon: "gift",
              direction: "Gift idea UGC in a cozy decorated room. The person wraps or presents the product as a gift, smiles warmly, shows why it is the perfect present.",
              script: "Vous cherchez un cadeau qui fait plaisir ? Voici mon idée parfaite.", duration: 10),
    ]

    static func preset(_ id: String?) -> UGCPreset? { all.first { $0.id == id } }
}
