import WidgetKit
import SwiftUI

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent())
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: configuration)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        var entries: [SimpleEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, configuration: configuration)
            entries.append(entry)
        }

        return Timeline(entries: entries, policy: .atEnd)
    }

//    func relevances() async -> WidgetRelevances<ConfigurationAppIntent> {
//        // Generate a list containing the contexts this widget is relevant in.
//    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
}

struct widgetEntryView : View {
  @Environment(\.widgetFamily) var widgetFamily
  var entry: Provider.Entry

  var numberOfLists: String? {
    let defaults = UserDefaults(suiteName: "group.com.joshuacrowley.tinytalkingtodos")
    return defaults?.string(forKey: "widget_total_lists")
  }
  
  struct RecentList: Codable {
    let listId: String
    let name: String
    let emoji: String
  }
  
  var recentLists: [RecentList]? {
    let defaults = UserDefaults(suiteName: "group.com.joshuacrowley.tinytalkingtodos")
    guard let data = defaults?.data(forKey: "widget_recent_lists"),
          let lists = try? JSONDecoder().decode([RecentList].self, from: data) else {
      return nil
    }
    if widgetFamily == .systemSmall || widgetFamily == .systemMedium {
      return Array(lists.prefix(3))
    }
    return lists
  }
  
  var body: some View {
    ZStack {
      HStack {
        VStack(alignment: .leading, spacing: 6) {
          HStack {
            Image(systemName: "basket")
              .font(.headline)
              .foregroundStyle(
                LinearGradient(
                  gradient: Gradient(colors: [Color.yellow, Color.orange]),
                  startPoint: .top,
                  endPoint: .bottom
                )
              )
            Text("Shopping")
              .font(.headline)
          }
          
          if let numberOfLists = numberOfLists {
            Text("\(numberOfLists) lists")
              .font(.subheadline)
              .foregroundColor(.secondary)
          }
          
          if let recentLists = recentLists {
            VStack(alignment: .leading, spacing: 4) {
              ForEach(recentLists, id: \.listId) { list in
                HStack {
                  Text(list.emoji)
                  Text(list.name)
                    .font(.system(size: 14))
                }
              }
            }
          } else {
            VStack(spacing: 0) {
              Text("📝")
                .font(.largeTitle)
              Text(
                widgetFamily == .systemSmall ? "No lists yet!" :
                  widgetFamily == .systemMedium ? "You don't have any lists yet!" :
                  "You don't have any lists yet.\nCreate one to get started!"
              )
              .multilineTextAlignment(.center)
              .font(.subheadline)
              .foregroundColor(.secondary)
              .padding(.horizontal)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
          }
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      
      if widgetFamily != .systemSmall {
        VStack {
          Spacer()
          HStack {
            Spacer()
            Text("Powered by Expo")
              .font(.system(size: 10))
              .fontWeight(.semibold)
              .foregroundColor(.secondary)
              .padding(.trailing, 4)
          }
        }
      }
    }
  }
}

struct widget: Widget {
  
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview(as: .systemSmall) {
    widget()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley)
    SimpleEntry(date: .now, configuration: .starEyes)
}
