from parsers.asciiparser import ASCIIParser


parser = ASCIIParser(
    "datasets/test_ocean.csv"
)

data = parser.parse()


print("\n========== ASCII DATA ==========")

print("Latitude:")
print(data.latitude)

print("\nLongitude:")
print(data.longitude)

print("\nDepth:")
print(data.depth)

print("\nTemperature:")
print(data.temperature)

print("\nSalinity:")
print(data.salinity)

print("\nMetadata:")
print(data.metadata)