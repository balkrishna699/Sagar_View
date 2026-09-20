from abc import ABC, abstractmethod


class BaseParser(ABC):

    def __init__(self, filepath):
        self.filepath = filepath

    @abstractmethod
    def parse(self):
        """
        Parse the input dataset and return an OceanDataset.
        """
        pass